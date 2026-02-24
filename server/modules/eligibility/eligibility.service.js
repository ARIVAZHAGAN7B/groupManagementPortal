const db = require("../../config/db");
const repo = require("./eligibility.repository");
const { expandDepartmentCode } = require("../../utils/department.service");

const toDateOnly = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
};

const parseBooleanFilter = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;

  const normalized = String(value).toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;

  throw new Error("is_eligible must be true/false");
};

const LEADERBOARD_LIMIT = 30;
const LEADER_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];

const withRanks = (rows = []) =>
  rows.map((row, index) => ({
    rank: index + 1,
    ...row
  }));

const recordBasePoints = async (payload) => {
  const activityDate = payload.activity_date
    ? toDateOnly(payload.activity_date)
    : toDateOnly(new Date());

  if (!activityDate) throw new Error("Invalid activity_date");
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

  const startDate = toDateOnly(phase.start_date);
  const endDate = toDateOnly(phase.end_date);

  if (!startDate || !endDate) {
    throw new Error("Phase dates are invalid");
  }

  const [individualTarget, groupTargets, studentPoints, groupPoints] = await Promise.all([
    repo.getIndividualTarget(phaseId),
    repo.getGroupTargets(phaseId),
    repo.getStudentPhasePoints(startDate, endDate),
    repo.getGroupPhasePoints(startDate, endDate)
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
    evaluation_window: {
      start_date: startDate,
      end_date: endDate
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
    const startDate = toDateOnly(phase.start_date);
    const endDate = toDateOnly(phase.end_date);

    if (startDate && endDate) {
      const phaseRows = await repo.getStudentPhasePoints(startDate, endDate);
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

const getStudentLeaderboards = async () => {
  const [individualRows, leaderRows, groupRows] = await Promise.all([
    repo.getIndividualLeaderboard(LEADERBOARD_LIMIT),
    repo.getLeaderLeaderboard(LEADER_ROLES, LEADERBOARD_LIMIT),
    repo.getGroupLeaderboard(LEADERBOARD_LIMIT)
  ]);

  const normalizeStudentRow = (row) => ({
    ...row,
    department: expandDepartmentCode(row.department),
    total_base_points: Number(row.total_base_points) || 0
  });

  return {
    limit: LEADERBOARD_LIMIT,
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
  if (!startDate || !endDate) throw new Error("Phase dates are invalid");

  const [snapshot, groupTargets] = await Promise.all([
    repo.getGroupPhaseSnapshot(groupId, startDate, endDate),
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
  let targetPoints = null;
  let isEligible = null;

  if (phase?.phase_id && phase?.start_date && phase?.end_date) {
    const startDate = toDateOnly(phase.start_date);
    const endDate = toDateOnly(phase.end_date);

    if (startDate && endDate) {
      const [phasePointsRow, individualTarget] = await Promise.all([
        repo.getStudentPhasePointsByStudent(studentId, startDate, endDate),
        repo.getIndividualTarget(phase.phase_id)
      ]);

      thisPhaseBasePoints = Number(phasePointsRow?.this_phase_base_points) || 0;
      phaseId = phase.phase_id;

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
  getMyIndividualEligibility,
  getMyIndividualEligibilityHistory,
  getStudentBasePoints,
  getAdminStudentOverview,
  getStudentLeaderboards,
  getGroupEligibilitySummary,
  getMyDashboardSummary
};
