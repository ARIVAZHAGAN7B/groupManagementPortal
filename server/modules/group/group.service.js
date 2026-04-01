const groupRepo = require("./group.repository");
const systemConfigService = require("../systemConfig/systemConfig.service");
const phaseRepo = require("../phase/phase.repository");
const eligibilityRepo = require("../eligibility/eligibility.repository");

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
  const acceptingApplications =
    status !== "FROZEN" && vacancies !== null ? vacancies > 0 : status !== "FROZEN";

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
    current_phase_id: options.currentPhaseId || null,
    current_phase_eligibility_status: options.eligibilityStatus || "NOT_EVALUATED"
  };
};

exports.createGroup = async (groupData) => {
  if (!groupData.group_code || !groupData.group_name) {
    throw new Error("Group code and name required");
  }

  return await groupRepo.createGroup({
    ...groupData,
    tier: (groupData.tier || "D").toUpperCase(),
    status: groupData.status || "INACTIVE"
  });
};

exports.getGroups = async (options = {}) => {
  const [groups, policy, currentPhase] = await Promise.all([
    groupRepo.getAllGroups(),
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
        const haystack = [group?.group_id, group?.group_code, group?.group_name]
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
  return await groupRepo.updateGroup(id, data);
};

exports.deleteGroup = async (id) => {
  return await groupRepo.deleteGroup(id);
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
  return await groupRepo.freezeGroup(id, { status: "FROZEN" });
};
