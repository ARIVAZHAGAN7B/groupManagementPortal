const db = require("../../config/db");
const repo = require("./teamChangeTier.repository");
const phaseRepo = require("../phase/phase.repository");
const eligibilityRepo = require("../eligibility/eligibility.repository");
const eligibilityService = require("../eligibility/eligibility.service");
const groupRepo = require("../group/group.repository");

const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];
const TIERS = ["D", "C", "B", "A"];
const CHANGE_ACTIONS = ["PROMOTE", "DEMOTE"];
const GROUP_STATUSES = ["ACTIVE", "INACTIVE", "FROZEN"];

const toBoolOrNull = (value) => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  return null;
};

const getAdminIdByUserIdFrom = async (queryable, userId) => {
  const [rows] = await queryable.query(
    "SELECT admin_id FROM admins WHERE user_id=? LIMIT 1",
    [userId]
  );
  if (rows.length === 0) throw new Error("Admin not found");
  return rows[0].admin_id;
};

const ensureAdminActor = async (queryable, actorUser) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");
  const role = String(actorUser.role).toUpperCase();
  if (!ADMIN_ROLES.includes(role)) {
    throw new Error("Only admin can manage tier changes");
  }
  return getAdminIdByUserIdFrom(queryable, actorUser.userId);
};

const normalizeTier = (value) => {
  const tier = String(value || "")
    .trim()
    .toUpperCase();
  if (!TIERS.includes(tier)) throw new Error("Invalid group tier");
  return tier;
};

const normalizeGroupStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toUpperCase();
  if (!GROUP_STATUSES.includes(status)) return "INACTIVE";
  return status;
};

const normalizeChangeAction = (value, { required = false } = {}) => {
  const action = String(value || "")
    .trim()
    .toUpperCase();

  if (!action) {
    if (required) throw new Error("change_action is required");
    return null;
  }

  if (!CHANGE_ACTIONS.includes(action)) {
    throw new Error("change_action must be PROMOTE or DEMOTE");
  }

  return action;
};

const getNextTier = (tier) => {
  const idx = TIERS.indexOf(tier);
  if (idx < 0) return tier;
  return TIERS[Math.min(idx + 1, TIERS.length - 1)];
};

const getPrevTier = (tier) => {
  const idx = TIERS.indexOf(tier);
  if (idx < 0) return tier;
  return TIERS[Math.max(idx - 1, 0)];
};

const getTierForAction = (tier, action) => {
  if (action === "PROMOTE") return getNextTier(tier);
  if (action === "DEMOTE") return getPrevTier(tier);
  return tier;
};

const sortPhasesAsc = (rows = []) =>
  [...rows].sort((a, b) => {
    const aDate = new Date(a?.start_date || 0).getTime();
    const bDate = new Date(b?.start_date || 0).getTime();
    if (aDate !== bDate) return aDate - bDate;
    return String(a?.phase_id || "").localeCompare(String(b?.phase_id || ""));
  });

const getPhaseContext = async (phaseId) => {
  const [allPhases, phase] = await Promise.all([
    phaseRepo.getAllPhases(),
    phaseRepo.getPhaseById(phaseId)
  ]);

  if (!phase) throw new Error("Phase not found");

  const ordered = sortPhasesAsc(Array.isArray(allPhases) ? allPhases : []);
  const idx = ordered.findIndex((p) => String(p.phase_id) === String(phaseId));
  const previousPhase = idx > 0 ? ordered[idx - 1] : null;

  return {
    phase,
    previousPhase,
    allPhasesOrdered: ordered
  };
};

const buildRecommendation = ({
  currentTier,
  groupStatus,
  lastPhaseEligible,
  requestedAction
}) => {
  const normalizedTier = normalizeTier(currentTier);
  const normalizedStatus = normalizeGroupStatus(groupStatus);
  const lastEligible = toBoolOrNull(lastPhaseEligible);
  const selectedAction = normalizeChangeAction(requestedAction);

  if (normalizedStatus !== "ACTIVE") {
    return {
      change_action: "DEMOTE",
      recommended_tier: getPrevTier(normalizedTier),
      rule_code: `${normalizedStatus}_AUTO_DEMOTE`,
      action_locked: true,
      available_actions: ["DEMOTE"]
    };
  }

  const changeAction = selectedAction || (lastEligible === true ? "PROMOTE" : "DEMOTE");

  return {
    change_action: changeAction,
    recommended_tier: getTierForAction(normalizedTier, changeAction),
    rule_code: selectedAction
      ? `ACTIVE_MANUAL_${changeAction}`
      : `ACTIVE_DEFAULT_${changeAction}`,
    action_locked: false,
    available_actions: CHANGE_ACTIONS
  };
};

const getEligibilityMapForPhase = async (phase, executor) => {
  if (!phase?.phase_id) return new Map();

  let rows = await eligibilityRepo.getGroupEligibility(phase.phase_id, {}, executor);
  if (
    (!Array.isArray(rows) || rows.length === 0) &&
    String(phase.status || "").toUpperCase() !== "ACTIVE"
  ) {
    await eligibilityService.evaluatePhaseEligibility(phase.phase_id);
    rows = await eligibilityRepo.getGroupEligibility(phase.phase_id, {}, executor);
  }

  return new Map(
    (Array.isArray(rows) ? rows : []).map((row) => [
      String(row.group_id),
      toBoolOrNull(row.is_eligible)
    ])
  );
};

const toSavedTierChangeSnapshot = (saved) => {
  if (!saved) return null;

  return {
    team_change_tier_id: saved.team_change_tier_id,
    phase_id: saved.phase_id,
    group_id: saved.group_id,
    previous_phase_id: saved.previous_phase_id || null,
    current_tier: normalizeTier(saved.current_tier),
    recommended_tier: normalizeTier(saved.recommended_tier),
    change_action: normalizeChangeAction(saved.change_action, { required: true }),
    last_phase_eligible: toBoolOrNull(saved.last_phase_eligible),
    previous_phase_eligible: toBoolOrNull(saved.previous_phase_eligible),
    rule_code: saved.rule_code,
    approved_by_admin_id: saved.approved_by_admin_id,
    applied_at: saved.applied_at
  };
};

const getPhaseTierChangePreview = async (phaseId, actorUser) => {
  await ensureAdminActor(db, actorUser);

  const { phase, previousPhase } = await getPhaseContext(phaseId);

  const [groups, phaseEligibility, previousPhaseEligibility, savedChanges] = await Promise.all([
    groupRepo.getAllGroups(),
    getEligibilityMapForPhase(phase),
    getEligibilityMapForPhase(previousPhase || null),
    repo.findByPhase(phase.phase_id)
  ]);

  const savedByGroup = new Map(
    (Array.isArray(savedChanges) ? savedChanges : []).map((row) => [String(row.group_id), row])
  );

  const rows = (Array.isArray(groups) ? groups : []).map((group) => {
    const liveCurrentTier = normalizeTier(group.tier);
    const liveLastPhaseEligible = phaseEligibility.has(String(group.group_id))
      ? phaseEligibility.get(String(group.group_id))
      : null;
    const livePreviousPhaseEligible = previousPhaseEligibility.has(String(group.group_id))
      ? previousPhaseEligibility.get(String(group.group_id))
      : null;
    const saved = toSavedTierChangeSnapshot(savedByGroup.get(String(group.group_id)) || null);

    const currentTier = saved?.current_tier || liveCurrentTier;
    const lastPhaseEligible =
      saved?.last_phase_eligible !== undefined ? saved.last_phase_eligible : liveLastPhaseEligible;
    const previousPhaseEligible =
      saved?.previous_phase_eligible !== undefined
        ? saved.previous_phase_eligible
        : livePreviousPhaseEligible;

    const recommendation = saved
      ? {
          change_action: saved.change_action,
          recommended_tier: saved.recommended_tier,
          rule_code: saved.rule_code,
          action_locked: true,
          available_actions: [saved.change_action]
        }
      : buildRecommendation({
          currentTier,
          groupStatus: group.status,
          lastPhaseEligible
        });

    return {
      group_id: group.group_id,
      group_code: group.group_code,
      group_name: group.group_name,
      group_status: group.status,
      active_member_count: Number(group.active_member_count) || 0,
      current_tier: currentTier,
      last_phase_eligible: lastPhaseEligible,
      previous_phase_id: saved?.previous_phase_id || previousPhase?.phase_id || null,
      previous_phase_eligible: previousPhaseEligible,
      ...recommendation,
      team_change_tier: saved
    };
  });

  const actionRank = { PROMOTE: 0, DEMOTE: 1 };
  rows.sort((a, b) => {
    const aRank = actionRank[a.change_action] ?? 9;
    const bRank = actionRank[b.change_action] ?? 9;
    if (aRank !== bRank) return aRank - bRank;
    return Number(a.group_id) - Number(b.group_id);
  });

  return {
    phase: {
      phase_id: phase.phase_id,
      phase_name: phase.phase_name,
      start_date: phase.start_date,
      end_date: phase.end_date,
      status: phase.status
    },
    previous_phase: previousPhase
      ? {
          phase_id: previousPhase.phase_id,
          phase_name: previousPhase.phase_name,
          start_date: previousPhase.start_date,
          end_date: previousPhase.end_date,
          status: previousPhase.status
        }
      : null,
    rows
  };
};

const computeSingleGroupPreviewTx = async (conn, phaseId, groupId, options = {}) => {
  const { phase, previousPhase } = await getPhaseContext(phaseId);

  // Backfill missing eligibility for historical phases before deriving decisions.
  if (String(phase.status || "").toUpperCase() !== "ACTIVE") {
    const phaseRows = await eligibilityRepo.getGroupEligibility(phase.phase_id, {});
    if (!Array.isArray(phaseRows) || phaseRows.length === 0) {
      await eligibilityService.evaluatePhaseEligibility(phase.phase_id);
    }
  }
  if (previousPhase && String(previousPhase.status || "").toUpperCase() !== "ACTIVE") {
    const prevRows = await eligibilityRepo.getGroupEligibility(previousPhase.phase_id, {});
    if (!Array.isArray(prevRows) || prevRows.length === 0) {
      await eligibilityService.evaluatePhaseEligibility(previousPhase.phase_id);
    }
  }

  const [groupRows] = await conn.query(
    `SELECT g.group_id, g.group_code, g.group_name, g.tier, g.status
     FROM sgroup g
     WHERE g.group_id=?
     LIMIT 1
     FOR UPDATE`,
    [groupId]
  );
  const group = groupRows[0];
  if (!group) throw new Error("Group not found");

  const [phaseEligibilityRows, previousPhaseEligibilityRows] = await Promise.all([
    eligibilityRepo.getGroupEligibility(phase.phase_id, { group_id: Number(groupId) }, conn),
    previousPhase?.phase_id
      ? eligibilityRepo.getGroupEligibility(previousPhase.phase_id, { group_id: Number(groupId) }, conn)
      : Promise.resolve([])
  ]);

  const lastPhaseEligible =
    Array.isArray(phaseEligibilityRows) && phaseEligibilityRows[0]
      ? toBoolOrNull(phaseEligibilityRows[0].is_eligible)
      : null;
  const previousPhaseEligible =
    Array.isArray(previousPhaseEligibilityRows) && previousPhaseEligibilityRows[0]
      ? toBoolOrNull(previousPhaseEligibilityRows[0].is_eligible)
      : null;

  const currentTier = normalizeTier(group.tier);
  const recommendation = buildRecommendation({
    currentTier,
    groupStatus: group.status,
    lastPhaseEligible,
    requestedAction: options.change_action
  });

  return {
    phase,
    previousPhase,
    group,
    current_tier: currentTier,
    last_phase_eligible: lastPhaseEligible,
    previous_phase_eligible: previousPhaseEligible,
    ...recommendation
  };
};

const applyPhaseTierChange = async (phaseId, groupId, actorUser, payload = {}) => {
  const numericGroupId = Number(groupId);
  if (!Number.isInteger(numericGroupId) || numericGroupId <= 0) {
    throw new Error("group_id must be a positive integer");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const adminId = await ensureAdminActor(conn, actorUser);
    const preview = await computeSingleGroupPreviewTx(conn, phaseId, numericGroupId, {
      change_action: payload?.change_action
    });

    const existing = await repo.findByPhaseAndGroupTx(conn, phaseId, numericGroupId);
    if (existing) {
      throw new Error("team_change_tier already exists for this phase and group");
    }

    if (preview.recommended_tier !== preview.current_tier) {
      await conn.query("UPDATE sgroup SET tier=? WHERE group_id=?", [
        preview.recommended_tier,
        numericGroupId
      ]);
    }

    await repo.upsertAppliedChangeTx(conn, {
      phase_id: phaseId,
      group_id: numericGroupId,
      previous_phase_id: preview.previousPhase?.phase_id || null,
      current_tier: preview.current_tier,
      recommended_tier: preview.recommended_tier,
      change_action: preview.change_action,
      last_phase_eligible: preview.last_phase_eligible,
      previous_phase_eligible: preview.previous_phase_eligible,
      rule_code: preview.rule_code,
      approved_by_admin_id: adminId
    });

    await conn.commit();

    return {
      message: "Tier change applied",
      phase_id: phaseId,
      group_id: numericGroupId,
      current_tier: preview.current_tier,
      recommended_tier: preview.recommended_tier,
      change_action: preview.change_action,
      rule_code: preview.rule_code,
      previous_phase_id: preview.previousPhase?.phase_id || null
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const getPhaseWiseTeamChangeTier = async (phaseId, actorUser) => {
  await ensureAdminActor(db, actorUser);
  const { phase } = await getPhaseContext(phaseId);
  const rows = await repo.findByPhase(phase.phase_id);
  return {
    phase,
    rows: Array.isArray(rows) ? rows : []
  };
};

module.exports = {
  getPhaseTierChangePreview,
  applyPhaseTierChange,
  getPhaseWiseTeamChangeTier
};
