const db = require("../../config/db");
const repo = require("./teamChangeTier.repository");
const phaseRepo = require("../phase/phase.repository");
const eligibilityRepo = require("../eligibility/eligibility.repository");
const groupRepo = require("../group/group.repository");

const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];
const TIERS = ["D", "C", "B", "A"];

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
  lastPhaseEligible,
  previousPhaseEligible
}) => {
  const normalizedTier = normalizeTier(currentTier);
  const lastEligible = toBoolOrNull(lastPhaseEligible);
  const prevEligible = toBoolOrNull(previousPhaseEligible);

  if (lastEligible === true) {
    const targetTier = getNextTier(normalizedTier);
    if (targetTier === normalizedTier) {
      return {
        change_action: "SAME",
        recommended_tier: normalizedTier,
        rule_code: "LAST_PHASE_ELIGIBLE_TOP_TIER"
      };
    }
    return {
      change_action: "PROMOTE",
      recommended_tier: targetTier,
      rule_code: "LAST_PHASE_ELIGIBLE_PROMOTE"
    };
  }

  if (lastEligible === false) {
    if (prevEligible === false) {
      const targetTier = getPrevTier(normalizedTier);
      if (targetTier === normalizedTier) {
        return {
          change_action: "SAME",
          recommended_tier: normalizedTier,
          rule_code: "LAST_TWO_NOT_ELIGIBLE_BOTTOM_TIER"
        };
      }
      return {
        change_action: "DEMOTE",
        recommended_tier: targetTier,
        rule_code: "LAST_TWO_NOT_ELIGIBLE_DEMOTE"
      };
    }

    return {
      change_action: "SAME",
      recommended_tier: normalizedTier,
      rule_code:
        prevEligible === true
          ? "LAST_PHASE_NOT_ELIGIBLE_PREVIOUS_ELIGIBLE_SAME"
          : "LAST_PHASE_NOT_ELIGIBLE_PREVIOUS_MISSING_SAME"
    };
  }

  return {
    change_action: "SAME",
    recommended_tier: normalizedTier,
    rule_code: "LAST_PHASE_ELIGIBILITY_MISSING_SAME"
  };
};

const getEligibilityMapForPhase = async (phaseId, executor) => {
  if (!phaseId) return new Map();
  const rows = await eligibilityRepo.getGroupEligibility(phaseId, {}, executor);
  return new Map(
    (Array.isArray(rows) ? rows : []).map((row) => [
      String(row.group_id),
      toBoolOrNull(row.is_eligible)
    ])
  );
};

const getPhaseTierChangePreview = async (phaseId, actorUser) => {
  await ensureAdminActor(db, actorUser);

  const { phase, previousPhase } = await getPhaseContext(phaseId);

  const [groups, phaseEligibility, previousPhaseEligibility, savedChanges] = await Promise.all([
    groupRepo.getAllGroups(),
    getEligibilityMapForPhase(phase.phase_id),
    getEligibilityMapForPhase(previousPhase?.phase_id || null),
    repo.findByPhase(phase.phase_id)
  ]);

  const savedByGroup = new Map(
    (Array.isArray(savedChanges) ? savedChanges : []).map((row) => [String(row.group_id), row])
  );

  const rows = (Array.isArray(groups) ? groups : []).map((group) => {
    const currentTier = normalizeTier(group.tier);
    const lastPhaseEligible = phaseEligibility.has(String(group.group_id))
      ? phaseEligibility.get(String(group.group_id))
      : null;
    const previousPhaseEligible = previousPhaseEligibility.has(String(group.group_id))
      ? previousPhaseEligibility.get(String(group.group_id))
      : null;

    const recommendation = buildRecommendation({
      currentTier,
      lastPhaseEligible,
      previousPhaseEligible
    });

    const saved = savedByGroup.get(String(group.group_id)) || null;

    return {
      group_id: group.group_id,
      group_code: group.group_code,
      group_name: group.group_name,
      group_status: group.status,
      active_member_count: Number(group.active_member_count) || 0,
      current_tier: currentTier,
      last_phase_eligible: lastPhaseEligible,
      previous_phase_id: previousPhase?.phase_id || null,
      previous_phase_eligible: previousPhaseEligible,
      ...recommendation,
      team_change_tier: saved
        ? {
            team_change_tier_id: saved.team_change_tier_id,
            phase_id: saved.phase_id,
            group_id: saved.group_id,
            current_tier: saved.current_tier,
            recommended_tier: saved.recommended_tier,
            change_action: saved.change_action,
            rule_code: saved.rule_code,
            approved_by_admin_id: saved.approved_by_admin_id,
            applied_at: saved.applied_at
          }
        : null
    };
  });

  const actionRank = { PROMOTE: 0, DEMOTE: 1, SAME: 2 };
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

const computeSingleGroupPreviewTx = async (conn, phaseId, groupId) => {
  const { phase, previousPhase } = await getPhaseContext(phaseId);

  const [groupRows] = await conn.query(
    `SELECT g.group_id, g.group_code, g.group_name, g.tier, g.status
     FROM Sgroup g
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
    lastPhaseEligible,
    previousPhaseEligible
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

const applyPhaseTierChange = async (phaseId, groupId, actorUser) => {
  const numericGroupId = Number(groupId);
  if (!Number.isInteger(numericGroupId) || numericGroupId <= 0) {
    throw new Error("group_id must be a positive integer");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const adminId = await ensureAdminActor(conn, actorUser);
    const preview = await computeSingleGroupPreviewTx(conn, phaseId, numericGroupId);

    const existing = await repo.findByPhaseAndGroupTx(conn, phaseId, numericGroupId);
    if (existing) {
      throw new Error("team_change_tier already exists for this phase and group");
    }

    if (String(preview.group.status || "").toUpperCase() === "FROZEN") {
      throw new Error("Cannot apply tier change for a frozen group");
    }

    if (preview.recommended_tier !== preview.current_tier) {
      await conn.query("UPDATE Sgroup SET tier=? WHERE group_id=?", [
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

