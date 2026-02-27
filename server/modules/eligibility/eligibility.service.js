const db = require("../../config/db");
const repo = require("./eligibility.repository");
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

const LEADERBOARD_LIMIT = 30;
const LEADER_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];
const LEADERBOARD_TIERS = new Set(["D", "C", "B", "A"]);

const withRanks = (rows = []) =>
  rows.map((row, index) => ({
    rank: index + 1,
    ...row
  }));

const normalizeLeaderboardFilters = (query = {}) => {
  const phaseIdRaw = String(query?.phase_id ?? "").trim();
  const tierRaw = String(query?.tier ?? "").trim().toUpperCase();

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

  return { phase_id, tier };
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

    await conn.commit();

    const summary = await repo.getStudentBasePoints(payload.student_id, conn);
    return {
      history_id,
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

const evaluatePhaseEligibility = async (phaseId) => {
  const phase = await repo.getPhaseById(phaseId);
  if (!phase) throw new Error("Phase not found");

  const window = getPhaseWindow(phase);
  if (!window) {
    throw new Error("Phase dates are invalid");
  }

  const [individualTarget, groupTargets, studentPoints, groupPoints] = await Promise.all([
    repo.getIndividualTarget(phaseId),
    repo.getGroupTargets(phaseId),
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
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  const individualEligibleCount = individualRows.filter((row) => row.is_eligible).length;
  const groupEligibleCount = groupRows.filter((row) => row.is_eligible).length;

  return {
    phase_id: phaseId,
    phase_name: phase.phase_name || null,
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
      individual_evaluated: individualRows.length,
      individual_eligible: individualEligibleCount,
      group_evaluated: groupRows.length,
      group_eligible: groupEligibleCount
    }
  };
};

const getIndividualEligibility = async (phaseId, query = {}) => {
  const is_eligible = parseBooleanFilter(query.is_eligible);
  return repo.getIndividualEligibility(phaseId, {
    student_id: query.student_id,
    is_eligible
  });
};

const getGroupEligibility = async (phaseId, query = {}) => {
  const is_eligible = parseBooleanFilter(query.is_eligible);
  return repo.getGroupEligibility(phaseId, {
    group_id: query.group_id ? Number(query.group_id) : undefined,
    is_eligible
  });
};

const getMyIndividualEligibility = async (phaseId, userId) => {
  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  const rows = await repo.getIndividualEligibility(phaseId, {
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

  await repo.upsertIndividualEligibility([
    {
      student_id: studentId,
      phase_id: phaseId,
      this_phase_base_points: points,
      is_eligible: payload.is_eligible,
      reason_code: reasonCode
    }
  ]);

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

  await repo.upsertGroupEligibility([
    {
      group_id: numericGroupId,
      phase_id: phaseId,
      this_phase_group_points: points,
      is_eligible: payload.is_eligible,
      reason_code: reasonCode
    }
  ]);

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
  const leaderboardFilters = filters.tier ? { tier: filters.tier } : {};

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
        repo.getIndividualLeaderboardByPhase(
          phaseWindow.start_at,
          phaseWindow.end_at,
          LEADERBOARD_LIMIT,
          leaderboardFilters
        ),
        repo.getLeaderLeaderboardByPhase(
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
        repo.getIndividualLeaderboard(LEADERBOARD_LIMIT, leaderboardFilters),
        repo.getLeaderLeaderboard(LEADER_ROLES, LEADERBOARD_LIMIT, leaderboardFilters),
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
      tier: filters.tier
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

  const [snapshot, groupTargets] = await Promise.all([
    repo.getGroupPhaseSnapshot(groupId, window.start_at, window.end_at),
    repo.getGroupTargets(phaseId)
  ]);

  if (!snapshot) throw new Error("Group not found");

  const tier = String(snapshot.tier || "").toUpperCase();
  const targetRow = (groupTargets || []).find(
    (row) => String(row?.tier || "").toUpperCase() === tier
  );

  const earned = Number(snapshot.earned_points) || 0;
  const target =
    targetRow?.group_target === undefined || targetRow?.group_target === null
      ? null
      : Number(targetRow.group_target);
  const hasTarget = Number.isFinite(target);

  return {
    phase_id: phase.phase_id,
    phase_name: phase.phase_name || null,
    group_id: snapshot.group_id,
    group_code: snapshot.group_code,
    group_name: snapshot.group_name,
    tier: snapshot.tier,
    group_status: snapshot.group_status,
    active_member_count: Number(snapshot.active_member_count) || 0,
    earned_points: earned,
    target_points: hasTarget ? target : null,
    is_eligible: hasTarget ? earned >= target : null
  };
};

const getMyDashboardSummary = async (userId, fallbackName = null) => {
  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  const studentId = student.student_id;
  const basePointsSummary = await repo.getStudentBasePoints(studentId);
  const totalBasePoints = Number(basePointsSummary?.total_base_points) || 0;

  const phase = await repo.getCurrentPhase();
  let thisPhaseBasePoints = 0;
  let phaseId = null;
  let phaseName = null;
  let targetPoints = null;
  let isEligible = null;

  if (phase?.phase_id && phase?.start_date && phase?.end_date) {
    const window = getPhaseWindow(phase);

    if (window) {
      const [phasePointsRow, individualTarget] = await Promise.all([
        repo.getStudentPhasePointsByStudent(studentId, window.start_at, window.end_at),
        repo.getIndividualTarget(phase.phase_id)
      ]);

      thisPhaseBasePoints = Number(phasePointsRow?.this_phase_base_points) || 0;
      phaseId = phase.phase_id;
      phaseName = phase.phase_name || null;

      if (individualTarget !== null && !Number.isNaN(Number(individualTarget))) {
        targetPoints = Number(individualTarget);
        isEligible = thisPhaseBasePoints >= targetPoints;
      }
    }
  }

  return {
    student_id: studentId,
    name: fallbackName || null,
    base_points: totalBasePoints,
    this_phase_base_points: thisPhaseBasePoints,
    total_points: totalBasePoints,
    this_phase_eligibility: {
      phase_id: phaseId,
      phase_name: phaseName,
      earned_points: thisPhaseBasePoints,
      target_points: targetPoints,
      is_eligible: isEligible
    }
  };
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
  getStudentBasePoints,
  getAdminStudentOverview,
  getStudentLeaderboards,
  getGroupEligibilitySummary,
  getMyDashboardSummary
};
