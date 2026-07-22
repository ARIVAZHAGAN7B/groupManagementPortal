const db = require("../../config/db");
const repo = require("./eligibility.repository");
const groupPointRepo = require("../groupPoint/groupPoint.repository");
const membershipRepo = require("../membership/membership.repository");
const membershipService = require("../membership/membership.service");
const hubRepo = require("../hub/hub.repository");
const teamRepo = require("../team/team.repository");
const { expandDepartmentCode } = require("../../utils/department.service");

const pad2 = (value) => String(value).padStart(2, "0");

const parseDateValue = (value) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getTime());
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      return new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3])
      );
    }
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const formatDateOnly = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const formatDateTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${formatDateOnly(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(
    date.getSeconds()
  )}`;
};

const toDateOnly = (value) => {
  const d = parseDateValue(value);
  if (!d) return null;
  return formatDateOnly(d);
};

const toDateTimeOnly = (value) => {
  const d = parseDateValue(value);
  if (!d) return null;
  return formatDateTime(d);
};

const normalizeTimeValue = (value, fallback) => {
  const source = value === undefined || value === null || value === "" ? fallback : value;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(source).trim());
  if (!match) return fallback;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return fallback;
  }

  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};

const getPhaseWindow = (phase) => {
  const startDate = toDateOnly(phase?.start_date);
  const endDate = toDateOnly(phase?.end_date);
  if (!startDate || !endDate) return null;

  const startTime = normalizeTimeValue(phase?.start_time, "00:00:00");
  const endTime = normalizeTimeValue(phase?.end_time, "23:59:59");

  return {
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    start_at: `${startDate} ${startTime}`,
    end_at: `${endDate} ${endTime}`
  };
};

const parseBooleanFilter = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;

  const normalized = String(value).toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;

  throw new Error("is_eligible must be true/false");
};

const normalizeReasonCode = (value, fallbackPrefix = "ADMIN_OVERRIDE") => {
  const raw = String(value ?? "").trim();
  if (raw.length < 3) {
    throw new Error("reason_code must be at least 3 characters");
  }

  const normalized = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);

  return normalized || fallbackPrefix;
};

const buildEligibilityResult = ({
  phaseId,
  phaseName,
  window,
  individualTarget,
  groupTargets,
  individualEvaluated,
  individualEligible,
  groupEvaluated,
  groupEligible,
  preservedSnapshot = false
}) => ({
  phase_id: phaseId,
  phase_name: phaseName || null,
  evaluation_window: {
    start_date: window.start_date,
    end_date: window.end_date,
    start_time: window.start_time,
    end_time: window.end_time,
    start_at: window.start_at,
    end_at: window.end_at
  },
  targets: {
    individual_target: individualTarget,
    group_targets: groupTargets
  },
  totals: {
    individual_evaluated: individualEvaluated,
    individual_eligible: individualEligible,
    group_evaluated: groupEvaluated,
    group_eligible: groupEligible
  },
  preserved_snapshot: preservedSnapshot
});

const mapDashboardMembership = (row) => ({
  team_membership_id: Number(row?.team_membership_id) || 0,
  team_id: Number(row?.team_id) || 0,
  team_code: row?.team_code || null,
  team_name: row?.team_name || null,
  team_type: row?.team_type || null,
  team_status: row?.team_status || null,
  role: row?.role || null,
  status: row?.status || null,
  join_date: row?.join_date || null,
  notes: row?.notes || null,
  event_id:
    row?.event_id === undefined || row?.event_id === null ? null : Number(row.event_id),
  event_code: row?.event_code || null,
  event_name: row?.event_name || null,
  event_status: row?.event_status || null
});

const mapDashboardGroup = (row) => {
  if (!row) return null;

  return {
    membership_id: Number(row.membership_id) || 0,
    student_id: row.student_id || null,
    group_id: Number(row.group_id) || 0,
    group_code: row.group_code || null,
    group_name: row.group_name || null,
    tier: row.tier || null,
    role: row.role || null,
    membership_status: row.membership_status || null,
    group_status: row.group_status || null,
    member_count: Number(row.member_count) || 0,
    join_date: row.join_date || null
  };
};

const LEADERBOARD_LIMIT = 30;
const LEADER_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];
const LEADERBOARD_TIERS = new Set(["D", "C", "B", "A"]);
const INDIVIDUAL_ELIGIBILITY_MULTIPLIER_BASIS = 12;
const GROUP_TIER_MULTIPLIER_BASIS = {
  D: 11,
  C: 12,
  B: 13,
  A: 14
};
const EMPTY_MULTIPLIER_COUNTS = {
  "1.1": 0,
  "1.2": 0,
  "1.3": 0,
  "1.4": 0
};
let eligibilityPointBackfillPromise = null;

const toFixedDecimal = (value) => Number((Number(value) || 0).toFixed(2));

const getMultiplierFromBasis = (basis) => toFixedDecimal((Number(basis) || 0) / 10);

// Multiplier awards are stored as bonus points, not the re-multiplied total.
const calculateAwardedPoints = (points, basis) =>
  toFixedDecimal(((Number(points) || 0) * Math.max((Number(basis) || 0) - 10, 0)) / 10);

const buildIndividualEligibilityPointRows = (rows = []) =>
  (Array.isArray(rows) ? rows : []).map((row) => {
    const sourceBasePoints = Number(row?.this_phase_base_points) || 0;
    const isEligible = row?.is_eligible === true || row?.is_eligible === 1;
    const multiplierBasis = INDIVIDUAL_ELIGIBILITY_MULTIPLIER_BASIS;

    return {
      student_id: row.student_id,
      phase_id: row.phase_id,
      source_base_points: sourceBasePoints,
      multiplier: getMultiplierFromBasis(multiplierBasis),
      is_eligible: isEligible,
      awarded_points: isEligible ? calculateAwardedPoints(sourceBasePoints, multiplierBasis) : 0
    };
  });

const buildGroupEligibilityPointRows = (rows = []) =>
  (Array.isArray(rows) ? rows : []).map((row) => {
    const sourceGroupPoints = Number(row?.this_phase_group_points) || 0;
    const appliedTier = String(
      row?.allocation_tier || row?.applied_tier || row?.tier || ""
    ).toUpperCase();
    const multiplierBasis = GROUP_TIER_MULTIPLIER_BASIS[appliedTier] || 10;
    const isEligible = row?.is_eligible === true || row?.is_eligible === 1;

    return {
      group_id: Number(row.group_id),
      phase_id: row.phase_id,
      source_group_points: sourceGroupPoints,
      applied_tier: appliedTier || null,
      multiplier: getMultiplierFromBasis(multiplierBasis),
      is_eligible: isEligible,
      awarded_points: isEligible ? calculateAwardedPoints(sourceGroupPoints, multiplierBasis) : 0
    };
  });

const syncEligibilityPointAllocations = async (
  { individualRows = [], groupRows = [] },
  executor
) => {
  const individualPointRows = buildIndividualEligibilityPointRows(individualRows);
  const groupPointRows = buildGroupEligibilityPointRows(groupRows);

  if (individualPointRows.length > 0) {
    await repo.upsertIndividualEligibilityPoints(individualPointRows, executor);
    await repo.recalculateIndividualEligibilityPointTotals(
      individualPointRows.map((row) => row.student_id),
      executor
    );
  }

  if (groupPointRows.length > 0) {
    await repo.upsertGroupEligibilityPoints(groupPointRows, executor);
    await repo.recalculateGroupEligibilityPointTotals(
      groupPointRows.map((row) => row.group_id),
      executor
    );
  }

  return {
    individualPointRows,
    groupPointRows
  };
};

const syncStoredEligibilityPointAllocations = async (phaseId) => {
  const [individualSnapshots, groupSnapshots] = await Promise.all([
    repo.getIndividualEligibility(phaseId),
    repo.getGroupEligibility(phaseId)
  ]);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await syncEligibilityPointAllocations(
      {
        individualRows: individualSnapshots,
        groupRows: groupSnapshots
      },
      conn
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const syncStoredEligibilityPointAllocationsForPhaseIds = async (phaseIds = []) => {
  let processedPhases = 0;

  for (const phaseId of Array.from(new Set((phaseIds || []).filter(Boolean)))) {
    await syncStoredEligibilityPointAllocations(phaseId);
    processedPhases += 1;
  }

  return {
    processed_phases: processedPhases
  };
};

const backfillMissingEligibilityPointAllocations = async (options = {}) => {
  if (eligibilityPointBackfillPromise) {
    return eligibilityPointBackfillPromise;
  }

  const safeLimit = Math.max(1, Math.min(Number(options.limit) || 50, 200));
  eligibilityPointBackfillPromise = (async () => {
    const phaseIds = await repo.listPhaseIdsMissingPointAllocations(safeLimit);
    let processedPhases = 0;

    for (const phaseId of phaseIds) {
      await syncStoredEligibilityPointAllocations(phaseId);
      processedPhases += 1;
    }

    return {
      processed_phases: processedPhases
    };
  })().finally(() => {
    eligibilityPointBackfillPromise = null;
  });

  return eligibilityPointBackfillPromise;
};

const syncStoredEligibilityPointAllocationsForAllPhases = async (options = {}) => {
  if (eligibilityPointBackfillPromise) {
    return eligibilityPointBackfillPromise;
  }

  const safeLimit = Math.max(1, Math.min(Number(options.limit) || 1000, 1000));
  eligibilityPointBackfillPromise = (async () => {
    const phaseIds = await repo.listPhaseIdsWithEligibilitySnapshots(safeLimit);
    return syncStoredEligibilityPointAllocationsForPhaseIds(phaseIds);
  })().finally(() => {
    eligibilityPointBackfillPromise = null;
  });

  return eligibilityPointBackfillPromise;
};

const withRanks = (rows = []) =>
  rows.map((row, index) => ({
    rank: index + 1,
    ...row
  }));

const normalizeLeaderboardFilters = (query = {}) => {
  const phaseIdRaw = String(query?.phase_id ?? "").trim();
  const tierRaw = String(query?.tier ?? "").trim().toUpperCase();
  const includeRaw = String(query?.include ?? "all").trim().toLowerCase();
  const excludeGroupStatusRaw = String(query?.exclude_group_status ?? "").trim();

  let phase_id = phaseIdRaw || null;
  if (phase_id && phase_id.toLowerCase() === "all") {
    phase_id = null;
  }

  let tier = tierRaw || null;
  if (tier === "ALL") {
    tier = null;
  }

  if (tier && !LEADERBOARD_TIERS.has(tier)) {
    throw new Error("tier must be one of D, C, B, A");
  }

  if (includeRaw !== "all" && includeRaw !== "groups") {
    throw new Error("include must be either all or groups");
  }

  const exclude_group_statuses = excludeGroupStatusRaw
    ? excludeGroupStatusRaw
        .split(",")
        .map((value) => String(value).trim().toUpperCase())
        .filter(Boolean)
    : [];

  return { phase_id, tier, include: includeRaw, exclude_group_statuses };
};

const recordBasePoints = async (payload) => {
  const legacyActivityDate = payload.activity_date ? toDateOnly(payload.activity_date) : null;
  const activityAt = payload.activity_at
    ? toDateTimeOnly(payload.activity_at)
    : legacyActivityDate
      ? `${legacyActivityDate} 00:00:00`
      : toDateTimeOnly(new Date());

  if (!activityAt) throw new Error("Invalid activity_at/activity_date");
  const activityDate = activityAt.split(" ")[0];
  if (!Number.isInteger(payload.points)) throw new Error("points must be an integer");
  if (!payload.student_id) throw new Error("student_id is required");
  if (!payload.reason || String(payload.reason).trim().length < 3) {
    throw new Error("reason must be at least 3 characters");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const student = await repo.getStudentById(payload.student_id, conn);
    if (!student) {
      throw new Error("Student not found");
    }

    const history_id = await repo.insertBasePointHistory(
      {
        student_id: payload.student_id,
        activity_date: activityDate,
        activity_at: activityAt,
        points: payload.points,
        reason: payload.reason.trim()
      },
      conn
    );

    await repo.upsertBasePointsTotal(payload.student_id, payload.points, conn);

    const membership = await groupPointRepo.findMembershipForStudentAt(
      payload.student_id,
      activityAt,
      conn
    );

    let group_point_id = null;
    let group_id = null;
    let membership_id = null;
    if (membership?.membership_id && membership?.group_id) {
      membership_id = membership.membership_id;
      group_id = membership.group_id;
      group_point_id = await groupPointRepo.insertGroupPoint(
        {
          student_id: payload.student_id,
          group_id: membership.group_id,
          membership_id: membership.membership_id,
          points: payload.points,
          created_at: activityAt
        },
        conn
      );
    }

    await conn.commit();

    const summary = await repo.getStudentBasePoints(payload.student_id, conn);
    return {
      history_id,
      group_point_id,
      membership_id,
      group_id,
      student_id: payload.student_id,
      total_base_points: summary?.total_base_points ?? payload.points
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const evaluatePhaseEligibility = async (phaseId, options = {}) => {
  const phase = await repo.getPhaseById(phaseId);
  if (!phase) throw new Error("Phase not found");

  const window = getPhaseWindow(phase);
  if (!window) {
    throw new Error("Phase dates are invalid");
  }

  const [individualTarget, groupTargets, snapshotStats] = await Promise.all([
    repo.getIndividualTarget(phaseId),
    repo.getGroupTargets(phaseId),
    repo.getPhaseEligibilitySnapshotStats(phaseId)
  ]);

  const isCompletedPhase = String(phase.status || "").toUpperCase() === "COMPLETED";
  const hasSnapshot =
    snapshotStats.individual_evaluated > 0 || snapshotStats.group_evaluated > 0;
  if (isCompletedPhase && hasSnapshot && options?.force !== true) {
    await syncStoredEligibilityPointAllocations(phaseId);

    return buildEligibilityResult({
      phaseId,
      phaseName: phase.phase_name,
      window,
      individualTarget,
      groupTargets,
      individualEvaluated: snapshotStats.individual_evaluated,
      individualEligible: snapshotStats.individual_eligible,
      groupEvaluated: snapshotStats.group_evaluated,
      groupEligible: snapshotStats.group_eligible,
      preservedSnapshot: true
    });
  }

  const [studentPoints, groupPoints] = await Promise.all([
    repo.getStudentPhasePoints(window.start_at, window.end_at),
    repo.getGroupPhasePoints(window.start_at, window.end_at)
  ]);

  const groupTargetMap = new Map(
    groupTargets.map((item) => [String(item.tier || "").toUpperCase(), Number(item.group_target)])
  );

  const individualRows = studentPoints.map((student) => {
    const points = Number(student.this_phase_base_points) || 0;
    if (individualTarget === null || Number.isNaN(individualTarget)) {
      return {
        student_id: student.student_id,
        phase_id: phaseId,
        this_phase_base_points: points,
        is_eligible: false,
        reason_code: "INDIVIDUAL_TARGET_NOT_CONFIGURED"
      };
    }

    const isEligible = points >= Number(individualTarget);
    return {
      student_id: student.student_id,
      phase_id: phaseId,
      this_phase_base_points: points,
      is_eligible: isEligible,
      reason_code: isEligible ? "INDIVIDUAL_TARGET_MET" : "INDIVIDUAL_TARGET_NOT_MET"
    };
  });

  const groupRows = groupPoints.map((group) => {
    const points = Number(group.this_phase_group_points) || 0;
    const tier = String(group.tier || "").toUpperCase();
    const configuredTarget = groupTargetMap.get(tier);

    if (configuredTarget === undefined || Number.isNaN(configuredTarget)) {
      return {
        group_id: group.group_id,
        phase_id: phaseId,
        this_phase_group_points: points,
        is_eligible: false,
        reason_code: "GROUP_TARGET_NOT_CONFIGURED"
      };
    }

    const isEligible = points >= configuredTarget;
    return {
      group_id: group.group_id,
      phase_id: phaseId,
      tier,
      this_phase_group_points: points,
      is_eligible: isEligible,
      reason_code: isEligible ? "GROUP_TARGET_MET" : "GROUP_TARGET_NOT_MET"
    };
  });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await repo.upsertIndividualEligibility(individualRows, conn);
    await repo.upsertGroupEligibility(groupRows, conn);
    await syncEligibilityPointAllocations(
      {
        individualRows,
        groupRows
      },
      conn
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  const individualEligibleCount = individualRows.filter((row) => row.is_eligible).length;
  const groupEligibleCount = groupRows.filter((row) => row.is_eligible).length;

  return buildEligibilityResult({
    phaseId,
    phaseName: phase.phase_name,
    window,
    individualTarget,
    groupTargets,
    individualEvaluated: individualRows.length,
    individualEligible: individualEligibleCount,
    groupEvaluated: groupRows.length,
    groupEligible: groupEligibleCount
  });
};

const getIndividualEligibility = async (phaseId, query = {}) => {
  const is_eligible = parseBooleanFilter(query.is_eligible);
  const rows = await repo.getIndividualEligibility(phaseId, {
    student_id: query.student_id,
    is_eligible
  });

  return (rows || []).map((row) => ({
    ...row,
    department: expandDepartmentCode(row.department),
    this_phase_base_points: Number(row.this_phase_base_points) || 0,
    eligibility_multiplier:
      row.eligibility_multiplier === undefined || row.eligibility_multiplier === null
        ? null
        : Number(row.eligibility_multiplier),
    eligibility_awarded_points:
      row.eligibility_awarded_points === undefined || row.eligibility_awarded_points === null
        ? 0
        : Number(row.eligibility_awarded_points)
  }));
};

const getGroupEligibility = async (phaseId, query = {}) => {
  const is_eligible = parseBooleanFilter(query.is_eligible);
  const rows = await repo.getGroupEligibility(phaseId, {
    group_id: query.group_id ? Number(query.group_id) : undefined,
    is_eligible
  });

  return (rows || []).map((row) => ({
    ...row,
    this_phase_group_points: Number(row.this_phase_group_points) || 0,
    eligibility_multiplier:
      row.eligibility_multiplier === undefined || row.eligibility_multiplier === null
        ? null
        : Number(row.eligibility_multiplier),
    eligibility_awarded_points:
      row.eligibility_awarded_points === undefined || row.eligibility_awarded_points === null
        ? 0
        : Number(row.eligibility_awarded_points)
  }));
};

const getMyIndividualEligibility = async (phaseId, userId) => {
  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  const rows = await getIndividualEligibility(phaseId, {
    student_id: student.student_id
  });
  return rows[0] || null;
};

const overrideIndividualEligibility = async (phaseId, studentId, payload = {}) => {
  const phase = await repo.getPhaseById(phaseId);
  if (!phase) throw new Error("Phase not found");

  const student = await repo.getStudentById(studentId);
  if (!student) throw new Error("Student not found");

  if (typeof payload.is_eligible !== "boolean") {
    throw new Error("is_eligible must be true/false");
  }

  const existing = await repo.getIndividualEligibility(phaseId, { student_id: studentId });
  const current = Array.isArray(existing) ? existing[0] : null;
  const points = Number(current?.this_phase_base_points) || 0;
  const reasonCode = normalizeReasonCode(
    payload.reason_code,
    payload.is_eligible ? "ADMIN_OVERRIDE_ELIGIBLE" : "ADMIN_OVERRIDE_NOT_ELIGIBLE"
  );

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await repo.upsertIndividualEligibility(
      [
        {
          student_id: studentId,
          phase_id: phaseId,
          this_phase_base_points: points,
          is_eligible: payload.is_eligible,
          reason_code: reasonCode
        }
      ],
      conn
    );
    await syncEligibilityPointAllocations(
      {
        individualRows: [
          {
            student_id: studentId,
            phase_id: phaseId,
            this_phase_base_points: points,
            is_eligible: payload.is_eligible
          }
        ]
      },
      conn
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  return {
    phase_id: phaseId,
    student_id: studentId,
    this_phase_base_points: points,
    is_eligible: payload.is_eligible,
    reason_code: reasonCode,
    override_applied: true
  };
};

const overrideGroupEligibility = async (phaseId, groupId, payload = {}) => {
  const phase = await repo.getPhaseById(phaseId);
  if (!phase) throw new Error("Phase not found");

  const numericGroupId = Number(groupId);
  if (!Number.isInteger(numericGroupId)) throw new Error("group_id must be an integer");

  const group = await repo.getGroupById(numericGroupId);
  if (!group) throw new Error("Group not found");

  if (typeof payload.is_eligible !== "boolean") {
    throw new Error("is_eligible must be true/false");
  }

  const existing = await repo.getGroupEligibility(phaseId, { group_id: numericGroupId });
  const current = Array.isArray(existing) ? existing[0] : null;
  const points = Number(current?.this_phase_group_points) || 0;
  const reasonCode = normalizeReasonCode(
    payload.reason_code,
    payload.is_eligible ? "ADMIN_OVERRIDE_GROUP_ELIGIBLE" : "ADMIN_OVERRIDE_GROUP_NOT_ELIGIBLE"
  );

  const allocationTier = String(current?.allocation_tier || current?.tier || group?.tier || "")
    .trim()
    .toUpperCase();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await repo.upsertGroupEligibility(
      [
        {
          group_id: numericGroupId,
          phase_id: phaseId,
          this_phase_group_points: points,
          is_eligible: payload.is_eligible,
          reason_code: reasonCode
        }
      ],
      conn
    );
    await syncEligibilityPointAllocations(
      {
        groupRows: [
          {
            group_id: numericGroupId,
            phase_id: phaseId,
            tier: allocationTier || null,
            this_phase_group_points: points,
            is_eligible: payload.is_eligible
          }
        ]
      },
      conn
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  return {
    phase_id: phaseId,
    group_id: numericGroupId,
    this_phase_group_points: points,
    is_eligible: payload.is_eligible,
    reason_code: reasonCode,
    override_applied: true
  };
};

const getMyIndividualEligibilityHistory = async (userId) => {
  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  const rows = await repo.getMyIndividualEligibilityHistory(student.student_id);

  return (rows || []).map((row) => ({
    ...row,
    this_phase_base_points: Number(row.this_phase_base_points) || 0,
    eligibility_multiplier:
      row.eligibility_multiplier === undefined || row.eligibility_multiplier === null
        ? null
        : Number(row.eligibility_multiplier),
    eligibility_awarded_points:
      row.eligibility_awarded_points === undefined || row.eligibility_awarded_points === null
        ? 0
        : Number(row.eligibility_awarded_points),
    target_points:
      row.target_points === undefined || row.target_points === null
        ? null
        : Number(row.target_points),
    is_eligible:
      row.is_eligible === undefined || row.is_eligible === null
        ? null
        : Boolean(row.is_eligible)
  }));
};

const getStudentBasePoints = async (studentId, limit) => {
  const [summary, history] = await Promise.all([
    repo.getStudentBasePoints(studentId),
    repo.getStudentBasePointHistory(studentId, limit)
  ]);

  return {
    summary: summary || {
      student_id: studentId,
      total_base_points: 0,
      last_updated: null
    },
    history
  };
};

const getAdminStudentOverview = async () => {
  const [phase, students] = await Promise.all([
    repo.getCurrentPhase(),
    repo.getAllStudentsWithActiveGroupAndBasePoints()
  ]);

  let phasePointMap = new Map();

  if (phase?.start_date && phase?.end_date) {
    const window = getPhaseWindow(phase);

    if (window) {
      const phaseRows = await repo.getStudentPhasePoints(window.start_at, window.end_at);
      phasePointMap = new Map(
        phaseRows.map((row) => [
          row.student_id,
          Number(row.this_phase_base_points) || 0
        ])
      );
    }
  }

  return {
    phase: phase || null,
    students: (students || []).map((student) => ({
      ...student,
      department: expandDepartmentCode(student.department),
      total_base_points: Number(student.total_base_points) || 0,
      this_phase_base_points: phasePointMap.get(student.student_id) || 0
    }))
  };
};

const getStudentLeaderboards = async (query = {}) => {
  const filters = normalizeLeaderboardFilters(query);
  const leaderboardFilters = {
    ...(filters.tier ? { tier: filters.tier } : {}),
    ...(filters.exclude_group_statuses?.length
      ? { exclude_statuses: filters.exclude_group_statuses }
      : {})
  };
  const groupsOnly = filters.include === "groups";

  let phase = null;
  let phaseWindow = null;
  if (filters.phase_id) {
    phase = await repo.getPhaseById(filters.phase_id);
    if (!phase) throw new Error("Phase not found");

    phaseWindow = getPhaseWindow(phase);
    if (!phaseWindow) throw new Error("Phase dates are invalid");
  }

  const [individualRows, leaderRows, groupRows] = phaseWindow
    ? await Promise.all([
        groupsOnly
          ? Promise.resolve([])
          : repo.getIndividualLeaderboardByPhase(
              phaseWindow.start_at,
              phaseWindow.end_at,
              LEADERBOARD_LIMIT,
              leaderboardFilters
            ),
        groupsOnly
          ? Promise.resolve([])
          : repo.getLeaderLeaderboardByPhase(
              LEADER_ROLES,
              phaseWindow.start_at,
              phaseWindow.end_at,
              LEADERBOARD_LIMIT,
              leaderboardFilters
            ),
        repo.getGroupLeaderboardByPhase(
          phaseWindow.start_at,
          phaseWindow.end_at,
          LEADERBOARD_LIMIT,
          leaderboardFilters
        )
      ])
    : await Promise.all([
        groupsOnly
          ? Promise.resolve([])
          : repo.getIndividualLeaderboard(LEADERBOARD_LIMIT, leaderboardFilters),
        groupsOnly
          ? Promise.resolve([])
          : repo.getLeaderLeaderboard(LEADER_ROLES, LEADERBOARD_LIMIT, leaderboardFilters),
        repo.getGroupLeaderboard(LEADERBOARD_LIMIT, leaderboardFilters)
      ]);

  const normalizeStudentRow = (row) => ({
    ...row,
    department: expandDepartmentCode(row.department),
    total_base_points: Number(row.total_base_points) || 0
  });

  return {
    limit: LEADERBOARD_LIMIT,
    filters: {
      phase_id: filters.phase_id,
      tier: filters.tier,
      include: filters.include,
      exclude_group_statuses: filters.exclude_group_statuses
    },
    points_scope: phaseWindow ? "PHASE" : "TOTAL",
    phase:
      phase && phaseWindow
        ? {
            phase_id: phase.phase_id,
            phase_name: phase.phase_name || null,
            start_date: phaseWindow.start_date,
            end_date: phaseWindow.end_date,
            start_time: phaseWindow.start_time,
            end_time: phaseWindow.end_time
          }
        : null,
    individual: withRanks((individualRows || []).map(normalizeStudentRow)),
    leaders: withRanks((leaderRows || []).map(normalizeStudentRow)),
    groups: withRanks(
      (groupRows || []).map((row) => ({
        ...row,
        active_member_count: Number(row.active_member_count) || 0,
        total_base_points: Number(row.total_base_points) || 0
      }))
    )
  };
};

const getGroupEligibilitySummary = async (phaseId, groupId) => {
  const phase = await repo.getPhaseById(phaseId);
  if (!phase) throw new Error("Phase not found");

  const startDate = toDateOnly(phase.start_date);
  const endDate = toDateOnly(phase.end_date);
  const window = getPhaseWindow(phase);
  if (!startDate || !endDate || !window) throw new Error("Phase dates are invalid");

  let [snapshot, groupTargets] = await Promise.all([
    repo.getStoredGroupEligibilitySummary(phaseId, groupId),
    repo.getGroupTargets(phaseId)
  ]);

  if (snapshot) {
    return {
      phase_id: phase.phase_id,
      phase_name: phase.phase_name || null,
      group_id: snapshot.group_id,
      group_code: snapshot.group_code || null,
      group_name: snapshot.group_name || null,
      tier: snapshot.tier || null,
      group_status: snapshot.group_status || null,
      active_member_count: Number(snapshot.active_member_count) || 0,
      earned_points: Number(snapshot.earned_points) || 0,
      target_points:
        snapshot.target_points === undefined || snapshot.target_points === null
          ? null
          : Number(snapshot.target_points),
      eligibility_multiplier:
        snapshot.eligibility_multiplier === undefined || snapshot.eligibility_multiplier === null
          ? null
          : Number(snapshot.eligibility_multiplier),
      eligibility_awarded_points:
        snapshot.eligibility_awarded_points === undefined ||
        snapshot.eligibility_awarded_points === null
          ? 0
          : Number(snapshot.eligibility_awarded_points),
      is_eligible:
        snapshot.is_eligible === undefined || snapshot.is_eligible === null
          ? null
          : Boolean(snapshot.is_eligible),
      reason_code: snapshot.reason_code || null,
      evaluated_at: snapshot.evaluated_at || null
    };
  }

  const liveSnapshot = await repo.getGroupPhaseSnapshot(groupId, window.start_at, window.end_at);
  if (!liveSnapshot) throw new Error("Group not found");

  const tier = String(liveSnapshot.tier || "").toUpperCase();
  const targetRow = (groupTargets || []).find(
    (row) => String(row?.tier || "").toUpperCase() === tier
  );

  const earned = Number(liveSnapshot.earned_points) || 0;
  const target =
    targetRow?.group_target === undefined || targetRow?.group_target === null
      ? null
      : Number(targetRow.group_target);
  const hasTarget = Number.isFinite(target);
  const multiplierBasis = GROUP_TIER_MULTIPLIER_BASIS[tier] || 10;
  const isEligible = hasTarget ? earned >= target : null;

  return {
    phase_id: phase.phase_id,
    phase_name: phase.phase_name || null,
    group_id: liveSnapshot.group_id,
    group_code: liveSnapshot.group_code,
    group_name: liveSnapshot.group_name,
    tier: liveSnapshot.tier,
    group_status: liveSnapshot.group_status,
    active_member_count: Number(liveSnapshot.active_member_count) || 0,
    earned_points: earned,
    target_points: hasTarget ? target : null,
    eligibility_multiplier: getMultiplierFromBasis(multiplierBasis),
    eligibility_awarded_points:
      isEligible === true ? calculateAwardedPoints(earned, multiplierBasis) : 0,
    is_eligible: isEligible,
    reason_code: null,
    evaluated_at: null
  };
};

const normalizeOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const normalizeOptionalBoolean = (value) => {
  if (value === undefined || value === null) return null;
  return Boolean(value);
};

const mapEligibilityHistoryRow = (row) => ({
  ...row,
  this_phase_base_points: Number(row?.this_phase_base_points) || 0,
  eligibility_multiplier: normalizeOptionalNumber(row?.eligibility_multiplier),
  eligibility_awarded_points: Number(row?.eligibility_awarded_points) || 0,
  target_points: normalizeOptionalNumber(row?.target_points),
  is_eligible: normalizeOptionalBoolean(row?.is_eligible)
});

const mapGroupMembershipHistoryRow = (row) => ({
  membership_id: Number(row?.membership_id) || 0,
  student_id: row?.student_id || null,
  group_id: row?.group_id === undefined || row?.group_id === null ? null : Number(row.group_id),
  role: row?.role || null,
  status: row?.membership_status || null,
  join_date: row?.join_date || null,
  leave_date: row?.leave_date || null,
  incubation_end_date: row?.incubation_end_date || null,
  group_code: row?.group_code || null,
  group_name: row?.group_name || null,
  group_tier: row?.group_tier || null,
  group_status: row?.group_status || null
});

const mapTeamMembershipHistoryRow = (row) => ({
  team_membership_id: Number(row?.team_membership_id) || 0,
  team_id: Number(row?.team_id) || 0,
  student_id: row?.student_id || null,
  role: row?.role || null,
  status: row?.status || null,
  join_date: row?.join_date || null,
  leave_date: row?.leave_date || null,
  notes: row?.notes || null,
  team_code: row?.team_code || null,
  team_name: row?.team_name || null,
  team_type: row?.team_type || null,
  team_status: row?.team_status || null,
  event_id:
    row?.event_id === undefined || row?.event_id === null ? null : Number(row.event_id),
  event_code: row?.event_code || null,
  event_name: row?.event_name || null,
  event_status: row?.event_status || null,
  event_start_date: row?.event_start_date || null,
  event_end_date: row?.event_end_date || null
});

const mapPhaseTimelineRow = (row) => {
  const groupId =
    row?.group_id === undefined || row?.group_id === null ? null : Number(row.group_id);

  return {
    phase_id: row?.phase_id || null,
    phase_name: row?.phase_name || null,
    phase_start_date: row?.phase_start_date || null,
    phase_end_date: row?.phase_end_date || null,
    phase_change_day: row?.phase_change_day || null,
    phase_status: row?.phase_status || null,
    membership_reference_at: row?.membership_reference_at || null,
    group: groupId
      ? {
          membership_id: Number(row?.membership_id) || 0,
          group_id: groupId,
          group_code: row?.group_code || null,
          group_name: row?.group_name || null,
          tier: row?.group_tier || null,
          group_status: row?.group_status || null,
          membership_role: row?.membership_role || null,
          membership_status: row?.membership_status || null,
          membership_join_date: row?.membership_join_date || null,
          membership_leave_date: row?.membership_leave_date || null
        }
      : null,
    individual: {
      earned_points: Number(row?.this_phase_base_points) || 0,
      target_points: normalizeOptionalNumber(row?.individual_target_points),
      is_eligible: normalizeOptionalBoolean(row?.individual_is_eligible),
      reason_code: row?.individual_reason_code || null,
      evaluated_at: row?.individual_evaluated_at || null,
      eligibility_multiplier: normalizeOptionalNumber(row?.individual_eligibility_multiplier),
      eligibility_awarded_points: Number(row?.individual_eligibility_awarded_points) || 0
    },
    group_eligibility: groupId
      ? {
          group_id: groupId,
          group_code: row?.group_code || null,
          group_name: row?.group_name || null,
          tier: row?.group_allocation_tier || row?.group_tier || null,
          earned_points: Number(row?.this_phase_group_points) || 0,
          target_points: normalizeOptionalNumber(row?.group_target_points),
          is_eligible: normalizeOptionalBoolean(row?.group_is_eligible),
          reason_code: row?.group_reason_code || null,
          evaluated_at: row?.group_evaluated_at || null,
          eligibility_multiplier: normalizeOptionalNumber(row?.group_eligibility_multiplier),
          eligibility_awarded_points: Number(row?.group_eligibility_awarded_points) || 0
        }
      : null
  };
};

const groupTeamMembershipsByType = (rows = []) =>
  rows.reduce(
    (acc, row) => {
      const type = String(row?.team_type || "").toUpperCase();

      if (type === "HUB") {
        acc.hubs.push(row);
      } else if (type === "EVENT") {
        acc.event_groups.push(row);
      } else {
        acc.teams.push(row);
      }

      return acc;
    },
    {
      teams: [],
      hubs: [],
      event_groups: []
    }
  );

const buildMembershipCollection = (rows = []) => ({
  active: rows.filter((row) => String(row?.status || "").toUpperCase() === "ACTIVE"),
  previous: rows.filter((row) => String(row?.status || "").toUpperCase() !== "ACTIVE"),
  all: rows
});

const buildDashboardSummaryByStudentId = async (studentId, fallbackName = null) => {
  const [studentStats, phase, activeGroupRow, activeTeamMembershipRows, activeHubMembershipRows] = await Promise.all([
    repo.getDashboardStudentStats(studentId),
    repo.getCurrentPhase(),
    membershipRepo.getActiveMembershipWithGroupByStudent(studentId),
    teamRepo.getAllTeamMemberships({
      student_id: studentId,
      status: "ACTIVE",
      exclude_team_type: "HUB"
    }),
    hubRepo.getAllHubMemberships({
      student_id: studentId,
      status: "ACTIVE"
    })
  ]);
  const totalBasePoints = Number(studentStats?.total_base_points) || 0;
  const totalEligibilityPoints = Number(studentStats?.eligibility_total_points) || 0;
  const [activeGroupStats, rejoinDeadlineInfo] = await Promise.all([
    activeGroupRow?.group_id ? repo.getDashboardGroupStats(activeGroupRow.group_id) : null,
    activeGroupRow?.group_id ? null : membershipService.getRejoinDeadlineInfo(studentId)
  ]);
  const multiplierCounts = {
    ...EMPTY_MULTIPLIER_COUNTS,
    "1.1":
      (Number(studentStats?.multiplier_11_count) || 0) +
      (Number(activeGroupStats?.multiplier_11_count) || 0),
    "1.2":
      (Number(studentStats?.multiplier_12_count) || 0) +
      (Number(activeGroupStats?.multiplier_12_count) || 0),
    "1.3":
      (Number(studentStats?.multiplier_13_count) || 0) +
      (Number(activeGroupStats?.multiplier_13_count) || 0),
    "1.4":
      (Number(studentStats?.multiplier_14_count) || 0) +
      (Number(activeGroupStats?.multiplier_14_count) || 0)
  };
  const activeGroup = activeGroupRow
    ? {
        ...mapDashboardGroup(activeGroupRow),
        eligibility_total_points: Number(activeGroupStats?.eligibility_total_points) || 0
      }
    : null;
  const rejoinDeadline = rejoinDeadlineInfo
    ? {
        ...rejoinDeadlineInfo,
        self_join_rule_enforced: true,
        left_at: rejoinDeadlineInfo.left_at ? new Date(rejoinDeadlineInfo.left_at).toISOString() : null,
        rejoin_deadline_at: rejoinDeadlineInfo.rejoin_deadline_at
          ? new Date(rejoinDeadlineInfo.rejoin_deadline_at).toISOString()
          : null
      }
    : null;
  const teamMemberships = (activeTeamMembershipRows || []).map(mapDashboardMembership);
  const hubMemberships = (activeHubMembershipRows || []).map(mapDashboardMembership);
  const teams = teamMemberships.filter(
    (row) => String(row?.team_type || "").toUpperCase() === "TEAM"
  );
  const hubs = hubMemberships.filter(
    (row) => String(row?.team_type || "").toUpperCase() === "HUB"
  );
  const event_groups = teamMemberships.filter(
    (row) => String(row?.team_type || "").toUpperCase() === "EVENT"
  );

  let thisPhaseBasePoints = 0;
  const thisPhaseEligibility = {
    phase_id: phase?.phase_id || null,
    phase_name: phase?.phase_name || null,
    individual: {
      earned_points: 0,
      target_points: null,
      is_eligible: null
    },
    group: activeGroup
      ? {
          group_id: activeGroup.group_id,
          group_code: activeGroup.group_code,
          group_name: activeGroup.group_name,
          tier: activeGroup.tier || null,
          active_member_count: Number(activeGroup.member_count) || 0,
          earned_points: 0,
          target_points: null,
          is_eligible: null
        }
      : null
  };

  if (phase?.phase_id && phase?.start_date && phase?.end_date) {
    const window = getPhaseWindow(phase);

    if (window) {
      const [phasePointsRow, individualTarget, groupTargets, groupSnapshot] = await Promise.all([
        repo.getStudentPhasePointsByStudent(studentId, window.start_at, window.end_at),
        repo.getIndividualTarget(phase.phase_id),
        activeGroup?.group_id ? repo.getGroupTargets(phase.phase_id) : Promise.resolve([]),
        activeGroup?.group_id
          ? repo.getGroupPhaseSnapshot(activeGroup.group_id, window.start_at, window.end_at)
          : Promise.resolve(null)
      ]);

      thisPhaseBasePoints = Number(phasePointsRow?.this_phase_base_points) || 0;
      thisPhaseEligibility.individual.earned_points = thisPhaseBasePoints;

      if (individualTarget !== null && !Number.isNaN(Number(individualTarget))) {
        thisPhaseEligibility.individual.target_points = Number(individualTarget);
        thisPhaseEligibility.individual.is_eligible =
          thisPhaseBasePoints >= thisPhaseEligibility.individual.target_points;
      }

      if (thisPhaseEligibility.group) {
        const resolvedTier = String(groupSnapshot?.tier || activeGroup?.tier || "").toUpperCase();
        const groupTargetRow = (groupTargets || []).find(
          (row) => String(row?.tier || "").toUpperCase() === resolvedTier
        );
        const groupTarget =
          groupTargetRow?.group_target === undefined || groupTargetRow?.group_target === null
            ? null
            : Number(groupTargetRow.group_target);
        const groupEarnedPoints = Number(groupSnapshot?.earned_points) || 0;
        const hasGroupTarget = Number.isFinite(groupTarget);

        thisPhaseEligibility.group = {
          ...thisPhaseEligibility.group,
          group_code: groupSnapshot?.group_code || activeGroup?.group_code || null,
          group_name: groupSnapshot?.group_name || activeGroup?.group_name || null,
          tier: groupSnapshot?.tier || activeGroup?.tier || null,
          active_member_count:
            Number(groupSnapshot?.active_member_count) || Number(activeGroup?.member_count) || 0,
          earned_points: groupEarnedPoints,
          target_points: hasGroupTarget ? groupTarget : null,
          is_eligible: hasGroupTarget ? groupEarnedPoints >= groupTarget : null
        };
      }
    }
  }

  return {
    student_id: studentId,
    name: fallbackName || null,
    base_points: totalBasePoints,
    eligibility_points: totalEligibilityPoints,
    this_phase_base_points: thisPhaseBasePoints,
    total_points: totalBasePoints + totalEligibilityPoints,
    stats: {
      active_team_count: teams.length,
      active_hub_count: hubs.length,
      active_event_team_count: event_groups.length,
      individual_eligible_phase_count: Number(studentStats?.eligible_phase_count) || 0,
      active_group_eligible_phase_count: Number(activeGroupStats?.eligible_phase_count) || 0
    },
    group: activeGroup,
    teams,
    hubs,
    event_groups,
    this_phase_eligibility: thisPhaseEligibility,
    multiplier_counts: multiplierCounts,
    rejoin_deadline: rejoinDeadline
  };
};

const getAdminStudentProfile = async (studentId) => {
  const student = await repo.getStudentProfileById(studentId);
  if (!student) throw new Error("Student not found");

  const normalizedStudent = {
    ...student,
    department: expandDepartmentCode(student.department)
  };

  const [
    summary,
    basePointData,
    groupMembershipRows,
    teamMembershipRows,
    hubMembershipRows,
    eligibilityHistoryRows,
    phaseTimelineRows
  ] = await Promise.all([
    buildDashboardSummaryByStudentId(studentId, normalizedStudent.name || null),
    getStudentBasePoints(studentId, 100),
    membershipRepo.getAllMemberships({ student_id: studentId }),
    teamRepo.getAllTeamMemberships({ student_id: studentId, exclude_team_type: "HUB" }),
    hubRepo.getAllHubMemberships({ student_id: studentId }),
    repo.getMyIndividualEligibilityHistory(studentId),
    repo.getStudentPhaseTimeline(studentId)
  ]);

  const groupMemberships = (groupMembershipRows || []).map(mapGroupMembershipHistoryRow);
  const teamMemberships = [
    ...(teamMembershipRows || []).map(mapTeamMembershipHistoryRow),
    ...(hubMembershipRows || []).map(mapTeamMembershipHistoryRow)
  ];
  const membershipsByType = groupTeamMembershipsByType(teamMemberships);

  return {
    student: normalizedStudent,
    summary,
    base_points: {
      summary: {
        student_id: studentId,
        total_base_points: Number(basePointData?.summary?.total_base_points) || 0,
        last_updated: basePointData?.summary?.last_updated || null
      },
      history: Array.isArray(basePointData?.history)
        ? basePointData.history.map((row) => ({
            ...row,
            points: Number(row?.points) || 0
          }))
        : []
    },
    group_memberships: {
      current:
        groupMemberships.find((row) => String(row?.status || "").toUpperCase() === "ACTIVE") ||
        null,
      previous: groupMemberships.filter(
        (row) => String(row?.status || "").toUpperCase() !== "ACTIVE"
      ),
      all: groupMemberships
    },
    team_memberships: {
      teams: buildMembershipCollection(membershipsByType.teams),
      hubs: buildMembershipCollection(membershipsByType.hubs),
      event_groups: buildMembershipCollection(membershipsByType.event_groups),
      all: teamMemberships
    },
    eligibility_history: (eligibilityHistoryRows || []).map(mapEligibilityHistoryRow),
    phase_timeline: (phaseTimelineRows || []).map(mapPhaseTimelineRow)
  };
};

const getMyDashboardSummary = async (userId, fallbackName = null) => {
  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  return buildDashboardSummaryByStudentId(student.student_id, fallbackName);
};

module.exports = {
  recordBasePoints,
  evaluatePhaseEligibility,
  getIndividualEligibility,
  getGroupEligibility,
  overrideIndividualEligibility,
  overrideGroupEligibility,
  getMyIndividualEligibility,
  getMyIndividualEligibilityHistory,
  backfillMissingEligibilityPointAllocations,
  syncStoredEligibilityPointAllocationsForAllPhases,
  getStudentBasePoints,
  getAdminStudentOverview,
  getAdminStudentProfile,
  getStudentLeaderboards,
  getGroupEligibilitySummary,
  getMyDashboardSummary
};
