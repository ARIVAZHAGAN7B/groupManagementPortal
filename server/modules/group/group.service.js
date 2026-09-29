const groupRepo = require("./group.repository");
const db = require("../../config/db");
const systemConfigService = require("../systemConfig/systemConfig.service");
const phaseRepo = require("../phase/phase.repository");
const eligibilityRepo = require("../eligibility/eligibility.repository");
const activityPointsWriteService = require("../activityPointsWrite/activityPointsWrite.service");
const cacheService = require("../../utils/cacheService");

const toEligibilityStatus = (value) => {
  if (value === true || value === 1) return "ELIGIBLE";
  if (value === false || value === 0) return "NOT_ELIGIBLE";
  return "NOT_EVALUATED";
};

const toExcludedStatusSet = (value) => {
  if (value === undefined || value === null || value === "") return new Set();

  const values = Array.isArray(value)
    ? value
    : String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return new Set(values.map((item) => String(item).toUpperCase()));
};

const toOptionalBoolean = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return null;
};

const toOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeText = (value) => String(value || "").trim();

const normalizeAcceptingApplications = (value) => {
  const normalized = toOptionalBoolean(value);
  return normalized === null ? true : normalized;
};

const normalizeJoiningConditions = (value) => {
  const normalized = normalizeText(value);
  if (normalized.length > 255) {
    throw new Error("joining_conditions must be 255 characters or less");
  }
  return normalized || null;
};

const normalizeTier = (value) => {
  const tier = normalizeText(value).toUpperCase() || "D";
  if (!["D", "C", "B", "A"].includes(tier)) {
    throw new Error("tier must be one of D, C, B, A");
  }
  return tier;
};

const normalizeStatus = (value) => {
  const status = normalizeText(value).toUpperCase() || "INACTIVE";
  if (!["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"].includes(status)) {
    throw new Error("status must be one of ACTIVE, INACTIVE, FROZEN, ARCHIVED");
  }
  return status;
};

const ensureCaptainCanManageGroup = async (groupId, actorUser) => {
  const actorRole = String(actorUser?.role || "").toUpperCase();
  if (["ADMIN", "SYSTEM_ADMIN"].includes(actorRole)) {
    return;
  }

  const userId = normalizeText(actorUser?.userId);
  if (!userId) throw new Error("Unauthorized");

  const [studentRows] = await db.query(
    `SELECT student_id
     FROM students
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
  const studentId = studentRows?.[0]?.student_id || null;
  if (!studentId) {
    throw new Error("Student not found");
  }

  const [membershipRows] = await db.query(
    `SELECT membership_id
     FROM memberships
     WHERE student_id = ?
       AND group_id = ?
       AND status = 'ACTIVE'
       AND role = 'CAPTAIN'
     LIMIT 1`,
    [studentId, Number(groupId)]
  );

  if (membershipRows.length === 0) {
    throw new Error("Only admin or the active captain can manage group application settings");
  }
};

const normalizeGroupPayload = (groupData = {}, fallback = {}) => {
  const group_code = normalizeText(groupData.group_code ?? fallback.group_code);
  const group_name = normalizeText(groupData.group_name ?? fallback.group_name);

  if (!group_code) {
    throw new Error("group_code is required");
  }

  if (!group_name) {
    throw new Error("group_name is required");
  }

  return {
    group_code,
    group_name,
    tier: normalizeTier(groupData.tier ?? fallback.tier),
    status: normalizeStatus(groupData.status ?? fallback.status),
    accepting_applications: normalizeAcceptingApplications(
      groupData.accepting_applications ?? fallback.accepting_applications
    ),
    joining_conditions: normalizeJoiningConditions(
      groupData.joining_conditions ?? fallback.joining_conditions
    )
  };
};

const addDiscoveryFields = (group, policy, options = {}) => {
  if (!group) return group;

  const activeMemberCount =
    group.active_member_count === undefined || group.active_member_count === null
      ? null
      : Number(group.active_member_count);
  const totalPoints =
    group.total_points === undefined || group.total_points === null
      ? 0
      : Number(group.total_points);
  const lifetimeBasePoints =
    group.lifetime_base_points === undefined || group.lifetime_base_points === null
      ? 0
      : Number(group.lifetime_base_points);
  const eligibilityBonusPoints =
    group.eligibility_bonus_points === undefined || group.eligibility_bonus_points === null
      ? 0
      : Number(group.eligibility_bonus_points);
  const lifetimeTotalPoints =
    group.lifetime_total_points === undefined || group.lifetime_total_points === null
      ? lifetimeBasePoints + eligibilityBonusPoints
      : Number(group.lifetime_total_points);
  const maxMembers = Number(policy.max_group_members);
  const vacancies =
    activeMemberCount === null || Number.isNaN(maxMembers)
      ? null
      : Math.max(0, maxMembers - activeMemberCount);
  const status = String(group.status || "").toUpperCase();
  const acceptingApplicationsSetting =
    group.accepting_applications === undefined || group.accepting_applications === null
      ? true
      : Boolean(Number(group.accepting_applications));
  const acceptingApplications =
    acceptingApplicationsSetting &&
    (status !== "FROZEN" && vacancies !== null ? vacancies > 0 : status !== "FROZEN");

  return {
    ...group,
    active_member_count: activeMemberCount,
    captain_name: group.captain_name || group.leader_name || null,
    captain_points:
      group.captain_points === undefined || group.captain_points === null
        ? null
        : Number(group.captain_points),
    total_points: Number.isNaN(totalPoints) ? 0 : totalPoints,
    lifetime_base_points: Number.isNaN(lifetimeBasePoints) ? 0 : lifetimeBasePoints,
    eligibility_bonus_points: Number.isNaN(eligibilityBonusPoints) ? 0 : eligibilityBonusPoints,
    lifetime_total_points: Number.isNaN(lifetimeTotalPoints) ? 0 : lifetimeTotalPoints,
    vacancies,
    accepting_applications: acceptingApplications,
    accepting_applications_setting: acceptingApplicationsSetting,
    joining_conditions: group.joining_conditions || null,
    current_phase_id: options.currentPhaseId || null,
    current_phase_eligibility_status: options.eligibilityStatus || "NOT_EVALUATED"
  };
};

exports.createGroup = async (groupData) => {
  const normalized = normalizeGroupPayload(groupData, {
    tier: "D",
    status: "INACTIVE",
    accepting_applications: true,
    joining_conditions: null
  });

  const result = await groupRepo.createGroup(normalized);
  await activityPointsWriteService.writeGroupTier({
    group_id: result.insertId,
    tier: normalized.tier,
    source_module: "GROUP_SERVICE",
    sync_context: "GROUP_CREATED"
  });

  await cacheService.delPrefix("groups:");
  return result;
};

exports.getGroups = async (options = {}) => {
  const [groups, policy, currentPhase] = await Promise.all([
    cacheService.getOrSet("groups:catalogue", 8, () => groupRepo.getAllGroups()),
    systemConfigService.getOperationalPolicy(),
    phaseRepo.getCurrentPhase().catch(() => null)
  ]);
  const excludedStatuses = toExcludedStatusSet(options.exclude_status);
  const searchQuery = String(options.q || "").trim().toLowerCase();
  const tierFilter = String(options.tier || "").trim().toUpperCase();
  const statusFilter = String(options.status || "").trim().toUpperCase();
  const captainFilter = String(options.captain || "").trim().toLowerCase();
  const acceptingFilter = toOptionalBoolean(options.accepting);
  const hasVacancyFilter = toOptionalBoolean(options.has_vacancy);
  const minPoints = toOptionalNumber(options.min_points);
  const eligibilityStatusFilter = String(options.eligibility_status || "").trim().toUpperCase();

  let eligibilityByGroupId = new Map();
  if (currentPhase?.phase_id) {
    const rows = await eligibilityRepo.getGroupEligibility(currentPhase.phase_id, {}).catch(
      () => []
    );
    eligibilityByGroupId = new Map(
      (Array.isArray(rows) ? rows : []).map((row) => [
        String(row.group_id),
        toEligibilityStatus(row.is_eligible)
      ])
    );
  }

  return (groups || [])
    .filter((group) => !excludedStatuses.has(String(group?.status || "").toUpperCase()))
    .map((group) =>
      addDiscoveryFields(group, policy, {
        currentPhaseId: currentPhase?.phase_id || null,
        eligibilityStatus:
          eligibilityByGroupId.get(String(group.group_id)) || "NOT_EVALUATED"
      })
    )
    .filter((group) => {
      if (tierFilter && String(group?.tier || "").toUpperCase() !== tierFilter) {
        return false;
      }

      if (statusFilter && String(group?.status || "").toUpperCase() !== statusFilter) {
        return false;
      }

      if (
        eligibilityStatusFilter &&
        String(group?.current_phase_eligibility_status || "").toUpperCase() !==
          eligibilityStatusFilter
      ) {
        return false;
      }

      if (acceptingFilter !== null && Boolean(group?.accepting_applications) !== acceptingFilter) {
        return false;
      }

      if (hasVacancyFilter !== null) {
        const vacancies = Number(group?.vacancies);
        if (hasVacancyFilter && !(Number.isFinite(vacancies) && vacancies > 0)) {
          return false;
        }
        if (!hasVacancyFilter && !(Number.isFinite(vacancies) && vacancies === 0)) {
          return false;
        }
      }

      if (minPoints !== null) {
        const totalPoints = Number(group?.total_points);
        if (!Number.isFinite(totalPoints) || totalPoints < minPoints) {
          return false;
        }
      }

      if (searchQuery) {
        const haystack = [
          group?.group_id,
          group?.group_code,
          group?.group_name,
          group?.joining_conditions
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        if (!haystack.includes(searchQuery)) {
          return false;
        }
      }

      if (captainFilter) {
        const captainHaystack = [group?.captain_name]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        if (!captainHaystack.includes(captainFilter)) {
          return false;
        }
      }

      return true;
    });
};

exports.getGroup = async (id) => {
  const [group, policy, currentPhase] = await Promise.all([
    groupRepo.getGroupById(id),
    systemConfigService.getOperationalPolicy(),
    phaseRepo.getCurrentPhase().catch(() => null)
  ]);

  let eligibilityStatus = "NOT_EVALUATED";
  if (currentPhase?.phase_id && group?.group_id !== undefined && group?.group_id !== null) {
    const rows = await eligibilityRepo
      .getGroupEligibility(currentPhase.phase_id, { group_id: Number(group.group_id) })
      .catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) {
      eligibilityStatus = toEligibilityStatus(rows[0].is_eligible);
    }
  }

  return addDiscoveryFields(group, policy, {
    currentPhaseId: currentPhase?.phase_id || null,
    eligibilityStatus
  });
};

exports.updateGroup = async (id, data) => {
  const existing = await groupRepo.getGroupById(id);
  if (!existing) {
    throw new Error("Group not found");
  }

  const normalized = normalizeGroupPayload(data, existing);
  const result = await groupRepo.updateGroup(id, normalized);
  await activityPointsWriteService.writeGroupTier({
    group_id: id,
    tier: normalized.tier,
    previous_tier: existing.tier,
    source_module: "GROUP_SERVICE",
    sync_context: "GROUP_UPDATED"
  });
  await cacheService.delPrefix("groups:");
  return result;
};

exports.updateApplicationSettings = async (id, data, actorUser) => {
  const existing = await groupRepo.getGroupById(id);
  if (!existing) {
    throw new Error("Group not found");
  }

  await ensureCaptainCanManageGroup(id, actorUser);

  await groupRepo.setApplicationSettings(id, {
    accepting_applications: normalizeAcceptingApplications(data?.accepting_applications),
    joining_conditions: normalizeJoiningConditions(data?.joining_conditions)
  });
  await cacheService.delPrefix("groups:");
  return exports.getGroup(id);
};

exports.deleteGroup = async (id) => {
  const result = await groupRepo.deleteGroup(id);
  await cacheService.delPrefix("groups:");
  return result;
};

exports.activateGroup = async (id, options = {}) => {
  const force = Boolean(options.force);
  const policy = await systemConfigService.getOperationalPolicy();
  const snapshot = await groupRepo.getGroupActivationSnapshot(id);

  if (!snapshot) {
    throw new Error("Group not found");
  }

  const memberCount = Number(snapshot.active_member_count) || 0;
  const min = Number(policy.min_group_members);
  const max = Number(policy.max_group_members);
  const leadershipFilled =
    Number(snapshot.captain_count) > 0 &&
    Number(snapshot.vice_captain_count) > 0 &&
    Number(snapshot.strategist_count) > 0 &&
    Number(snapshot.manager_count) > 0;

  if (!force) {
    if (memberCount < min || memberCount > max) {
      throw new Error(
        `Group can be activated only when active member count is between ${min} and ${max}`
      );
    }

    if (policy.require_leadership_for_activation && !leadershipFilled) {
      throw new Error(
        "Group can be activated only after CAPTAIN, VICE_CAPTAIN, STRATEGIST and MANAGER roles are filled (or admin overrides)"
      );
    }
  }

  await groupRepo.activateGroup(id);
  await cacheService.delPrefix("groups:");
  return {
    group_id: Number(id),
    activated: true,
    override_used: force,
    policy_snapshot: {
      min_group_members: min,
      max_group_members: max,
      require_leadership_for_activation: policy.require_leadership_for_activation
    },
    current_snapshot: {
      active_member_count: memberCount,
      leadership_filled: leadershipFilled
    }
  };
};

exports.freezeGroup = async (id) => {
  const result = await groupRepo.freezeGroup(id, { status: "FROZEN" });
  await cacheService.delPrefix("groups:");
  return result;
};
