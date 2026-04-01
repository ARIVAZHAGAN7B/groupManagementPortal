const db = require("../../config/db");

const getExecutor = (executor) => executor || db;
const BASE_POINT_ACTIVITY_AT_EXPR =
  "COALESCE(h.activity_at, TIMESTAMP(h.activity_date, '00:00:00'))";
const GROUP_POINT_CREATED_AT_EXPR = "gp.created_at";
const PHASE_END_AT_EXPR = "TIMESTAMP(p.end_date, COALESCE(p.end_time, '23:59:59'))";
const PHASE_START_AT_EXPR = "TIMESTAMP(p.start_date, COALESCE(p.start_time, '00:00:00'))";
const PHASE_MEMBERSHIP_REFERENCE_AT_EXPR = `CASE
  WHEN ${PHASE_END_AT_EXPR} <= NOW() THEN ${PHASE_END_AT_EXPR}
  WHEN ${PHASE_START_AT_EXPR} <= NOW() THEN NOW()
  ELSE ${PHASE_START_AT_EXPR}
END`;
const INDIVIDUAL_ELIGIBILITY_AWARDED_POINTS_EXPR = `CASE
  WHEN iep.is_eligible = 1 THEN ROUND(iep.source_base_points * GREATEST(iep.multiplier - 1, 0), 2)
  ELSE 0
END`;
const GROUP_ELIGIBILITY_AWARDED_POINTS_EXPR = `CASE
  WHEN gep.is_eligible = 1 THEN ROUND(gep.source_group_points * GREATEST(gep.multiplier - 1, 0), 2)
  ELSE 0
END`;

const getPhaseById = async (phaseId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT phase_id, phase_name, start_date, end_date, start_time, end_time, status
     FROM phases
     WHERE phase_id = ?
     LIMIT 1`,
    [phaseId]
  );
  return rows[0] || null;
};

const getPhaseEligibilitySnapshotStats = async (phaseId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       COALESCE(ie.individual_evaluated, 0) AS individual_evaluated,
       COALESCE(ie.individual_eligible, 0) AS individual_eligible,
       COALESCE(ge.group_evaluated, 0) AS group_evaluated,
       COALESCE(ge.group_eligible, 0) AS group_eligible
     FROM (SELECT 1) seed
     LEFT JOIN (
       SELECT
         COUNT(*) AS individual_evaluated,
         SUM(CASE WHEN is_eligible = 1 THEN 1 ELSE 0 END) AS individual_eligible
       FROM individual_eligibility
       WHERE phase_id = ?
     ) ie ON 1 = 1
     LEFT JOIN (
       SELECT
         COUNT(*) AS group_evaluated,
         SUM(CASE WHEN is_eligible = 1 THEN 1 ELSE 0 END) AS group_eligible
       FROM group_eligibility
       WHERE phase_id = ?
     ) ge ON 1 = 1`,
    [phaseId, phaseId]
  );

  const row = rows[0] || {};
  return {
    individual_evaluated: Number(row.individual_evaluated) || 0,
    individual_eligible: Number(row.individual_eligible) || 0,
    group_evaluated: Number(row.group_evaluated) || 0,
    group_eligible: Number(row.group_eligible) || 0
  };
};

const getCurrentPhase = async (executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT phase_id, phase_name, start_date, end_date, start_time, end_time
     FROM phases
     WHERE status IN ('ACTIVE', 'INACTIVE')
       AND TIMESTAMP(start_date, COALESCE(start_time, '00:00:00')) <= NOW()
       AND TIMESTAMP(end_date, COALESCE(end_time, '23:59:59')) > NOW()
     ORDER BY
       start_date DESC,
       start_time DESC,
       CASE WHEN status = 'ACTIVE' THEN 0 ELSE 1 END
     LIMIT 1`
  );
  return rows[0] || null;
};

const getIndividualTarget = async (phaseId, executor) => {
  const exec = getExecutor(executor);

  const [fromDedicated] = await exec.query(
    `SELECT target
     FROM individual_phase_target
     WHERE phase_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [phaseId]
  );
  if (fromDedicated.length > 0) {
    return Number(fromDedicated[0].target);
  }

  const [fromPhaseTargets] = await exec.query(
    `SELECT individual_target
     FROM phase_targets
     WHERE phase_id = ?
     LIMIT 1`,
    [phaseId]
  );

  if (fromPhaseTargets.length === 0) return null;
  return Number(fromPhaseTargets[0].individual_target);
};

const getGroupTargets = async (phaseId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT tier, group_target
     FROM phase_targets
     WHERE phase_id = ?`,
    [phaseId]
  );
  return rows;
};

const getStudentPhasePoints = async (startDate, endDate, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       s.student_id,
       COALESCE(SUM(h.points), 0) AS this_phase_base_points
     FROM students s
     LEFT JOIN base_point_history h
       ON h.student_id = s.student_id
       AND ${BASE_POINT_ACTIVITY_AT_EXPR} BETWEEN ? AND ?
     GROUP BY s.student_id`,
    [startDate, endDate]
  );
  return rows;
};

const getStudentPhasePointsByStudent = async (studentId, startDate, endDate, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       s.student_id,
       COALESCE(SUM(h.points), 0) AS this_phase_base_points
     FROM students s
     LEFT JOIN base_point_history h
       ON h.student_id = s.student_id
       AND ${BASE_POINT_ACTIVITY_AT_EXPR} BETWEEN ? AND ?
     WHERE s.student_id = ?
     GROUP BY s.student_id`,
    [startDate, endDate, studentId]
  );
  return rows[0] || null;
};

const getAllStudentsWithActiveGroupAndBasePoints = async (executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       s.student_id,
       s.name,
       s.email,
       s.department,
       s.year,
       COALESCE(bph.total_base_points, bp.total_base_points, 0) AS total_base_points,
       COALESCE(bph.last_updated, bp.last_updated) AS base_points_last_updated,
       m.membership_id,
       m.group_id,
       m.role AS membership_role,
       m.status AS membership_status,
       m.join_date,
       m.leave_date,
       g.group_code,
       g.group_name,
       g.tier AS group_tier,
       g.status AS group_status
     FROM students s
     LEFT JOIN base_points bp
       ON bp.student_id = s.student_id
     LEFT JOIN (
       SELECT
         h.student_id,
         COALESCE(SUM(h.points), 0) AS total_base_points,
         MAX(h.created_at) AS last_updated
       FROM base_point_history h
       GROUP BY h.student_id
     ) bph
       ON bph.student_id = s.student_id
     LEFT JOIN memberships m
       ON m.student_id = s.student_id
      AND m.status = 'ACTIVE'
     LEFT JOIN sgroup g
       ON g.group_id = m.group_id
     ORDER BY s.student_id ASC`
  );
  return rows;
};

const getGroupPhasePoints = async (startDate, endDate, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       g.group_id,
       g.tier,
       COALESCE(gps.this_phase_group_points, 0) AS this_phase_group_points
     FROM sgroup g
     LEFT JOIN (
       SELECT
         gp.group_id,
         SUM(gp.points) AS this_phase_group_points
       FROM group_points gp
       WHERE ${GROUP_POINT_CREATED_AT_EXPR} BETWEEN ? AND ?
       GROUP BY gp.group_id
     ) gps
       ON gps.group_id = g.group_id
     GROUP BY g.group_id, g.tier`,
    [startDate, endDate]
  );
  return rows;
};

const getGroupPhaseSnapshot = async (groupId, startDate, endDate, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       g.group_id,
       g.group_code,
       g.group_name,
       g.tier,
       g.status AS group_status,
       COALESCE(mc.active_member_count, 0) AS active_member_count,
       COALESCE(gps.earned_points, 0) AS earned_points
     FROM sgroup g
     LEFT JOIN (
       SELECT group_id, COUNT(*) AS active_member_count
       FROM memberships
       WHERE status = 'ACTIVE'
       GROUP BY group_id
     ) mc
       ON mc.group_id = g.group_id
     LEFT JOIN (
       SELECT
         gp.group_id,
         SUM(gp.points) AS earned_points
       FROM group_points gp
       WHERE ${GROUP_POINT_CREATED_AT_EXPR} BETWEEN ? AND ?
       GROUP BY gp.group_id
     ) gps
       ON gps.group_id = g.group_id
     WHERE g.group_id = ?
     LIMIT 1`,
    [startDate, endDate, groupId]
  );
  return rows[0] || null;
};

const upsertIndividualEligibility = async (rows, executor) => {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const placeholders = rows.map(() => "(?, ?, ?, ?, ?, NOW())").join(", ");
  const values = rows.flatMap((row) => [
    row.student_id,
    row.phase_id,
    row.this_phase_base_points,
    row.is_eligible,
    row.reason_code
  ]);

  await getExecutor(executor).query(
    `INSERT INTO individual_eligibility
      (student_id, phase_id, this_phase_base_points, is_eligible, reason_code, evaluated_at)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       this_phase_base_points = VALUES(this_phase_base_points),
       is_eligible = VALUES(is_eligible),
       reason_code = VALUES(reason_code),
       evaluated_at = NOW()`,
    values
  );
};

const upsertGroupEligibility = async (rows, executor) => {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const placeholders = rows.map(() => "(?, ?, ?, ?, ?, NOW())").join(", ");
  const values = rows.flatMap((row) => [
    row.group_id,
    row.phase_id,
    row.this_phase_group_points,
    row.is_eligible,
    row.reason_code
  ]);

  await getExecutor(executor).query(
    `INSERT INTO group_eligibility
      (group_id, phase_id, this_phase_group_points, is_eligible, reason_code, evaluated_at)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       this_phase_group_points = VALUES(this_phase_group_points),
       is_eligible = VALUES(is_eligible),
       reason_code = VALUES(reason_code),
       evaluated_at = NOW()`,
    values
  );
};

const upsertIndividualEligibilityPoints = async (rows, executor) => {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const placeholders = rows.map(() => "(?, ?, ?, ?, ?, ?, NOW())").join(", ");
  const values = rows.flatMap((row) => [
    row.student_id,
    row.phase_id,
    Number(row.source_base_points) || 0,
    row.multiplier,
    row.is_eligible,
    row.awarded_points
  ]);

  await getExecutor(executor).query(
    `INSERT INTO individual_eligibility_points
      (student_id, phase_id, source_base_points, multiplier, is_eligible, awarded_points, calculated_at)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       source_base_points = VALUES(source_base_points),
       multiplier = VALUES(multiplier),
       is_eligible = VALUES(is_eligible),
       awarded_points = VALUES(awarded_points),
       calculated_at = NOW()`,
    values
  );
};

const upsertGroupEligibilityPoints = async (rows, executor) => {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const placeholders = rows.map(() => "(?, ?, ?, ?, ?, ?, ?, NOW())").join(", ");
  const values = rows.flatMap((row) => [
    Number(row.group_id),
    row.phase_id,
    Number(row.source_group_points) || 0,
    row.applied_tier || null,
    row.multiplier,
    row.is_eligible,
    row.awarded_points
  ]);

  await getExecutor(executor).query(
    `INSERT INTO group_eligibility_points
      (group_id, phase_id, source_group_points, applied_tier, multiplier, is_eligible, awarded_points, calculated_at)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       source_group_points = VALUES(source_group_points),
       applied_tier = VALUES(applied_tier),
       multiplier = VALUES(multiplier),
       is_eligible = VALUES(is_eligible),
       awarded_points = VALUES(awarded_points),
       calculated_at = NOW()`,
    values
  );
};

const recalculateIndividualEligibilityPointTotals = async (studentIds = [], executor) => {
  const ids = Array.from(
    new Set(
      (Array.isArray(studentIds) ? studentIds : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );

  if (ids.length === 0) return;

  const placeholders = ids.map(() => "?").join(", ");
  await getExecutor(executor).query(
    `INSERT INTO individual_eligibility_point_totals
      (student_id, total_points, last_updated)
     SELECT
       s.student_id,
       COALESCE(SUM(${INDIVIDUAL_ELIGIBILITY_AWARDED_POINTS_EXPR}), 0) AS total_points,
       NOW()
     FROM students s
     LEFT JOIN individual_eligibility_points iep
       ON iep.student_id = s.student_id
     WHERE s.student_id IN (${placeholders})
     GROUP BY s.student_id
     ON DUPLICATE KEY UPDATE
       total_points = VALUES(total_points),
       last_updated = NOW()`,
    ids
  );
};

const recalculateGroupEligibilityPointTotals = async (groupIds = [], executor) => {
  const ids = Array.from(
    new Set(
      (Array.isArray(groupIds) ? groupIds : [])
        .map((value) => Number(value))
        .filter(Number.isInteger)
    )
  );

  if (ids.length === 0) return;

  const placeholders = ids.map(() => "?").join(", ");
  await getExecutor(executor).query(
    `INSERT INTO group_eligibility_point_totals
      (group_id, total_points, last_updated)
     SELECT
       g.group_id,
       COALESCE(SUM(${GROUP_ELIGIBILITY_AWARDED_POINTS_EXPR}), 0) AS total_points,
       NOW()
     FROM sgroup g
     LEFT JOIN group_eligibility_points gep
       ON gep.group_id = g.group_id
     WHERE g.group_id IN (${placeholders})
     GROUP BY g.group_id
     ON DUPLICATE KEY UPDATE
       total_points = VALUES(total_points),
       last_updated = NOW()`,
    ids
  );
};

const getIndividualEligibilityPointTotal = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT student_id, total_points, last_updated
     FROM individual_eligibility_point_totals
     WHERE student_id = ?
     LIMIT 1`,
    [studentId]
  );

  return rows[0] || null;
};

const getGroupEligibilityPointTotal = async (groupId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT group_id, total_points, last_updated
     FROM group_eligibility_point_totals
     WHERE group_id = ?
     LIMIT 1`,
    [Number(groupId)]
  );

  return rows[0] || null;
};

const insertBasePointHistory = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO base_point_history
      (student_id, activity_date, activity_at, points, reason, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [
      payload.student_id,
      payload.activity_date,
      payload.activity_at,
      payload.points,
      payload.reason
    ]
  );
  return result.insertId;
};

const upsertBasePointsTotal = async (studentId, deltaPoints, executor) => {
  await getExecutor(executor).query(
    `INSERT INTO base_points (student_id, total_base_points, last_updated)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       total_base_points = total_base_points + VALUES(total_base_points),
       last_updated = NOW()`,
    [studentId, deltaPoints]
  );
};

const getStudentBasePoints = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       s.student_id,
       COALESCE(bph.total_base_points, bp.total_base_points, 0) AS total_base_points,
       COALESCE(bph.last_updated, bp.last_updated) AS last_updated
     FROM students s
     LEFT JOIN base_points bp
       ON bp.student_id = s.student_id
     LEFT JOIN (
       SELECT
         h.student_id,
         COALESCE(SUM(h.points), 0) AS total_base_points,
         MAX(h.created_at) AS last_updated
       FROM base_point_history h
       WHERE h.student_id = ?
       GROUP BY h.student_id
     ) bph
       ON bph.student_id = s.student_id
     WHERE s.student_id = ?
     LIMIT 1`,
    [studentId, studentId]
  );
  return rows[0] || null;
};

const getStudentBasePointHistory = async (studentId, limit = 50, executor) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const [rows] = await getExecutor(executor).query(
    `SELECT history_id, student_id, activity_date, activity_at, points, reason, created_at
     FROM base_point_history
     WHERE student_id = ?
     ORDER BY COALESCE(activity_at, TIMESTAMP(activity_date, '00:00:00')) DESC, history_id DESC
     LIMIT ?`,
    [studentId, safeLimit]
  );
  return rows;
};

const getIndividualEligibility = async (phaseId, filters = {}, executor) => {
  const clauses = ["ie.phase_id = ?"];
  const values = [phaseId];

  if (filters.student_id) {
    clauses.push("ie.student_id = ?");
    values.push(filters.student_id);
  }

  if (typeof filters.is_eligible === "boolean") {
    clauses.push("ie.is_eligible = ?");
    values.push(filters.is_eligible);
  }

  const [rows] = await getExecutor(executor).query(
    `SELECT
       ie.eligibility_id,
       ie.student_id,
       ie.phase_id,
       p.phase_name,
       ie.this_phase_base_points,
       iep.multiplier AS eligibility_multiplier,
       ${INDIVIDUAL_ELIGIBILITY_AWARDED_POINTS_EXPR} AS eligibility_awarded_points,
       ie.is_eligible,
       ie.reason_code,
       ie.evaluated_at,
       s.name AS student_name,
       s.department,
       s.year
     FROM individual_eligibility ie
     LEFT JOIN individual_eligibility_points iep
       ON iep.student_id = ie.student_id
      AND iep.phase_id = ie.phase_id
     LEFT JOIN students s ON s.student_id = ie.student_id
     LEFT JOIN phases p ON p.phase_id = ie.phase_id
     WHERE ${clauses.join(" AND ")}
     ORDER BY ie.this_phase_base_points DESC, ie.student_id ASC`,
    values
  );
  return rows;
};

const getGroupEligibility = async (phaseId, filters = {}, executor) => {
  const clauses = ["ge.phase_id = ?"];
  const values = [phaseId];

  if (filters.group_id) {
    clauses.push("ge.group_id = ?");
    values.push(filters.group_id);
  }

  if (typeof filters.is_eligible === "boolean") {
    clauses.push("ge.is_eligible = ?");
    values.push(filters.is_eligible);
  }

  const [rows] = await getExecutor(executor).query(
    `SELECT
       ge.eligibility_id,
       ge.group_id,
       ge.phase_id,
       p.phase_name,
       ge.this_phase_group_points,
       COALESCE(gep.applied_tier, g.tier) AS allocation_tier,
       gep.multiplier AS eligibility_multiplier,
       ${GROUP_ELIGIBILITY_AWARDED_POINTS_EXPR} AS eligibility_awarded_points,
       ge.is_eligible,
       ge.reason_code,
       ge.evaluated_at,
       g.group_code,
       g.group_name,
       g.tier
     FROM group_eligibility ge
     LEFT JOIN group_eligibility_points gep
       ON gep.group_id = ge.group_id
      AND gep.phase_id = ge.phase_id
     LEFT JOIN sgroup g ON g.group_id = ge.group_id
     LEFT JOIN phases p ON p.phase_id = ge.phase_id
     WHERE ${clauses.join(" AND ")}
     ORDER BY ge.this_phase_group_points DESC, ge.group_id ASC`,
    values
  );
  return rows;
};

const getStudentByUserId = async (userId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT student_id FROM students WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

const getStudentById = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT student_id FROM students WHERE student_id = ? LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
};

const getStudentProfileById = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT student_id, name, email, department, year
     FROM students
     WHERE student_id = ?
     LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
};

const getGroupById = async (groupId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT group_id, group_code, group_name, tier
     FROM sgroup
     WHERE group_id = ?
     LIMIT 1`,
    [groupId]
  );
  return rows[0] || null;
};

const getStudentEligiblePhaseCount = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT COUNT(DISTINCT phase_id) AS eligible_phase_count
     FROM individual_eligibility
     WHERE student_id = ?
       AND is_eligible = 1`,
    [studentId]
  );

  return Number(rows[0]?.eligible_phase_count) || 0;
};

const getGroupEligiblePhaseCount = async (groupId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT COUNT(DISTINCT phase_id) AS eligible_phase_count
     FROM group_eligibility
     WHERE group_id = ?
       AND is_eligible = 1`,
    [Number(groupId)]
  );

  return Number(rows[0]?.eligible_phase_count) || 0;
};

const getStudentMultiplierCounts = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT multiplier, COUNT(*) AS multiplier_count
     FROM individual_eligibility_points
     WHERE student_id = ?
       AND is_eligible = 1
       AND multiplier IN (1.10, 1.20, 1.30, 1.40)
     GROUP BY multiplier`,
    [studentId]
  );

  return rows || [];
};

const getGroupMultiplierCounts = async (groupId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT multiplier, COUNT(*) AS multiplier_count
     FROM group_eligibility_points
     WHERE group_id = ?
       AND is_eligible = 1
       AND multiplier IN (1.10, 1.20, 1.30, 1.40)
     GROUP BY multiplier`,
    [Number(groupId)]
  );

  return rows || [];
};

const getDashboardStudentStats = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       s.student_id,
       COALESCE(bph.total_base_points, bp.total_base_points, 0) AS total_base_points,
       COALESCE(iept.total_points, 0) AS eligibility_total_points,
       COALESCE(iec.eligible_phase_count, 0) AS eligible_phase_count,
       COALESCE(mult.multiplier_11_count, 0) AS multiplier_11_count,
       COALESCE(mult.multiplier_12_count, 0) AS multiplier_12_count,
       COALESCE(mult.multiplier_13_count, 0) AS multiplier_13_count,
       COALESCE(mult.multiplier_14_count, 0) AS multiplier_14_count
     FROM students s
     LEFT JOIN base_points bp
       ON bp.student_id = s.student_id
     LEFT JOIN (
       SELECT
         h.student_id,
         COALESCE(SUM(h.points), 0) AS total_base_points
       FROM base_point_history h
       WHERE h.student_id = ?
       GROUP BY h.student_id
     ) bph
       ON bph.student_id = s.student_id
     LEFT JOIN (
       SELECT
         student_id,
         COALESCE(SUM(${INDIVIDUAL_ELIGIBILITY_AWARDED_POINTS_EXPR}), 0) AS total_points
       FROM individual_eligibility_points iep
       WHERE student_id = ?
       GROUP BY student_id
     ) iept
       ON iept.student_id = s.student_id
     LEFT JOIN (
       SELECT
         student_id,
         COUNT(DISTINCT phase_id) AS eligible_phase_count
       FROM individual_eligibility
       WHERE student_id = ?
         AND is_eligible = 1
       GROUP BY student_id
     ) iec
       ON iec.student_id = s.student_id
     LEFT JOIN (
       SELECT
         student_id,
         SUM(CASE WHEN is_eligible = 1 AND ROUND(multiplier, 2) = 1.10 THEN 1 ELSE 0 END) AS multiplier_11_count,
         SUM(CASE WHEN is_eligible = 1 AND ROUND(multiplier, 2) = 1.20 THEN 1 ELSE 0 END) AS multiplier_12_count,
         SUM(CASE WHEN is_eligible = 1 AND ROUND(multiplier, 2) = 1.30 THEN 1 ELSE 0 END) AS multiplier_13_count,
         SUM(CASE WHEN is_eligible = 1 AND ROUND(multiplier, 2) = 1.40 THEN 1 ELSE 0 END) AS multiplier_14_count
       FROM individual_eligibility_points
       WHERE student_id = ?
       GROUP BY student_id
     ) mult
       ON mult.student_id = s.student_id
     WHERE s.student_id = ?
     LIMIT 1`,
    [studentId, studentId, studentId, studentId, studentId]
  );

  return rows[0] || null;
};

const getDashboardGroupStats = async (groupId, executor) => {
  const numericGroupId = Number(groupId);
  const [rows] = await getExecutor(executor).query(
    `SELECT
       g.group_id,
       COALESCE(gept.total_points, 0) AS eligibility_total_points,
       COALESCE(gec.eligible_phase_count, 0) AS eligible_phase_count,
       COALESCE(mult.multiplier_11_count, 0) AS multiplier_11_count,
       COALESCE(mult.multiplier_12_count, 0) AS multiplier_12_count,
       COALESCE(mult.multiplier_13_count, 0) AS multiplier_13_count,
       COALESCE(mult.multiplier_14_count, 0) AS multiplier_14_count
     FROM sgroup g
     LEFT JOIN (
       SELECT
         group_id,
         COALESCE(SUM(${GROUP_ELIGIBILITY_AWARDED_POINTS_EXPR}), 0) AS total_points
       FROM group_eligibility_points gep
       WHERE group_id = ?
       GROUP BY group_id
     ) gept
       ON gept.group_id = g.group_id
     LEFT JOIN (
       SELECT
         group_id,
         COUNT(DISTINCT phase_id) AS eligible_phase_count
       FROM group_eligibility
       WHERE group_id = ?
         AND is_eligible = 1
       GROUP BY group_id
     ) gec
       ON gec.group_id = g.group_id
     LEFT JOIN (
       SELECT
         group_id,
         SUM(CASE WHEN is_eligible = 1 AND ROUND(multiplier, 2) = 1.10 THEN 1 ELSE 0 END) AS multiplier_11_count,
         SUM(CASE WHEN is_eligible = 1 AND ROUND(multiplier, 2) = 1.20 THEN 1 ELSE 0 END) AS multiplier_12_count,
         SUM(CASE WHEN is_eligible = 1 AND ROUND(multiplier, 2) = 1.30 THEN 1 ELSE 0 END) AS multiplier_13_count,
         SUM(CASE WHEN is_eligible = 1 AND ROUND(multiplier, 2) = 1.40 THEN 1 ELSE 0 END) AS multiplier_14_count
       FROM group_eligibility_points
       WHERE group_id = ?
       GROUP BY group_id
     ) mult
       ON mult.group_id = g.group_id
     WHERE g.group_id = ?
     LIMIT 1`,
    [numericGroupId, numericGroupId, numericGroupId, numericGroupId]
  );

  return rows[0] || null;
};

const listPhaseIdsMissingPointAllocations = async (limit = 50, executor) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const [rows] = await getExecutor(executor).query(
    `SELECT missing.phase_id
     FROM (
       SELECT DISTINCT ie.phase_id
       FROM individual_eligibility ie
       LEFT JOIN individual_eligibility_points iep
         ON iep.student_id = ie.student_id
        AND iep.phase_id = ie.phase_id
       WHERE iep.point_id IS NULL
       UNION
       SELECT DISTINCT ge.phase_id
       FROM group_eligibility ge
       LEFT JOIN group_eligibility_points gep
         ON gep.group_id = ge.group_id
        AND gep.phase_id = ge.phase_id
       WHERE gep.point_id IS NULL
     ) missing
     INNER JOIN phases p
       ON p.phase_id = missing.phase_id
     ORDER BY
       CASE p.status
         WHEN 'COMPLETED' THEN 0
         WHEN 'ACTIVE' THEN 1
         ELSE 2
       END,
       p.end_date DESC,
       p.phase_id DESC
     LIMIT ?`,
    [safeLimit]
  );

  return (rows || []).map((row) => row.phase_id).filter(Boolean);
};

const listPhaseIdsWithEligibilitySnapshots = async (limit = 1000, executor) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 1000, 1000));
  const [rows] = await getExecutor(executor).query(
    `SELECT snapshot_phases.phase_id
     FROM (
       SELECT DISTINCT ie.phase_id
       FROM individual_eligibility ie
       UNION
       SELECT DISTINCT ge.phase_id
       FROM group_eligibility ge
     ) snapshot_phases
     INNER JOIN phases p
       ON p.phase_id = snapshot_phases.phase_id
     ORDER BY
       CASE p.status
         WHEN 'ACTIVE' THEN 0
         WHEN 'COMPLETED' THEN 1
         ELSE 2
       END,
       p.end_date DESC,
       p.phase_id DESC
     LIMIT ?`,
    [safeLimit]
  );

  return (rows || []).map((row) => row.phase_id).filter(Boolean);
};

const getMyIndividualEligibilityHistory = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       ie.eligibility_id,
       ie.student_id,
       ie.phase_id,
       p.phase_name,
       ie.this_phase_base_points,
       iep.multiplier AS eligibility_multiplier,
       ${INDIVIDUAL_ELIGIBILITY_AWARDED_POINTS_EXPR} AS eligibility_awarded_points,
       ie.is_eligible,
       ie.reason_code,
       ie.evaluated_at,
       p.start_date AS phase_start_date,
       p.end_date AS phase_end_date,
       p.change_day AS phase_change_day,
       p.status AS phase_status,
       COALESCE(
         (
           SELECT ipt.target
           FROM individual_phase_target ipt
           WHERE ipt.phase_id = ie.phase_id
           ORDER BY ipt.id DESC
           LIMIT 1
         ),
         (
           SELECT pt.individual_target
           FROM phase_targets pt
           WHERE pt.phase_id = ie.phase_id
           LIMIT 1
         )
       ) AS target_points
     FROM individual_eligibility ie
     LEFT JOIN individual_eligibility_points iep
       ON iep.student_id = ie.student_id
      AND iep.phase_id = ie.phase_id
     LEFT JOIN phases p ON p.phase_id = ie.phase_id
     WHERE ie.student_id = ?
     ORDER BY p.start_date DESC, ie.evaluated_at DESC, ie.eligibility_id DESC`,
    [studentId]
  );
  return rows;
};

const getStudentPhaseTimeline = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       p.phase_id,
       p.phase_name,
       p.start_date AS phase_start_date,
       p.end_date AS phase_end_date,
       p.change_day AS phase_change_day,
       p.status AS phase_status,
       ${PHASE_MEMBERSHIP_REFERENCE_AT_EXPR} AS membership_reference_at,
       m.membership_id,
       m.group_id,
       m.role AS membership_role,
       m.status AS membership_status,
       m.join_date AS membership_join_date,
       m.leave_date AS membership_leave_date,
       g.group_code,
       g.group_name,
       g.tier AS group_tier,
       g.status AS group_status,
       ie.this_phase_base_points,
       ie.is_eligible AS individual_is_eligible,
       ie.reason_code AS individual_reason_code,
       ie.evaluated_at AS individual_evaluated_at,
       iep.multiplier AS individual_eligibility_multiplier,
       ${INDIVIDUAL_ELIGIBILITY_AWARDED_POINTS_EXPR} AS individual_eligibility_awarded_points,
       COALESCE(
         (
           SELECT ipt.target
           FROM individual_phase_target ipt
           WHERE ipt.phase_id = p.phase_id
           ORDER BY ipt.id DESC
           LIMIT 1
         ),
         (
           SELECT pt.individual_target
           FROM phase_targets pt
           WHERE pt.phase_id = p.phase_id
           LIMIT 1
         )
       ) AS individual_target_points,
       ge.this_phase_group_points,
       ge.is_eligible AS group_is_eligible,
       ge.reason_code AS group_reason_code,
       ge.evaluated_at AS group_evaluated_at,
       gep.multiplier AS group_eligibility_multiplier,
       ${GROUP_ELIGIBILITY_AWARDED_POINTS_EXPR} AS group_eligibility_awarded_points,
       COALESCE(gep.applied_tier, g.tier) AS group_allocation_tier,
       (
         SELECT pt.group_target
         FROM phase_targets pt
         WHERE pt.phase_id = p.phase_id
           AND UPPER(pt.tier) = UPPER(COALESCE(gep.applied_tier, g.tier))
         LIMIT 1
       ) AS group_target_points
     FROM phases p
     LEFT JOIN memberships m
       ON m.membership_id = (
         SELECT m2.membership_id
         FROM memberships m2
         WHERE m2.student_id = ?
           AND m2.join_date <= ${PHASE_MEMBERSHIP_REFERENCE_AT_EXPR}
           AND (m2.leave_date IS NULL OR m2.leave_date > ${PHASE_MEMBERSHIP_REFERENCE_AT_EXPR})
         ORDER BY m2.join_date DESC, m2.membership_id DESC
         LIMIT 1
       )
     LEFT JOIN sgroup g
       ON g.group_id = m.group_id
     LEFT JOIN individual_eligibility ie
       ON ie.phase_id = p.phase_id
      AND ie.student_id = ?
     LEFT JOIN individual_eligibility_points iep
       ON iep.phase_id = p.phase_id
      AND iep.student_id = ?
     LEFT JOIN group_eligibility ge
       ON ge.phase_id = p.phase_id
      AND ge.group_id = m.group_id
     LEFT JOIN group_eligibility_points gep
       ON gep.phase_id = p.phase_id
      AND gep.group_id = m.group_id
     WHERE ${PHASE_START_AT_EXPR} <= NOW()
     ORDER BY p.start_date DESC, p.phase_id DESC`,
    [studentId, studentId, studentId]
  );

  return rows;
};

const getStoredGroupEligibilitySummary = async (phaseId, groupId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       ge.eligibility_id,
       ge.group_id,
       ge.phase_id,
       p.phase_name,
       p.start_date,
       p.end_date,
       p.status AS phase_status,
       g.group_code,
       g.group_name,
       g.status AS group_status,
       COALESCE(mc.active_member_count, 0) AS active_member_count,
       COALESCE(gep.applied_tier, g.tier) AS tier,
       ge.this_phase_group_points AS earned_points,
       (
         SELECT pt.group_target
         FROM phase_targets pt
         WHERE pt.phase_id = ge.phase_id
           AND UPPER(pt.tier) = UPPER(COALESCE(gep.applied_tier, g.tier))
         LIMIT 1
       ) AS target_points,
       gep.multiplier AS eligibility_multiplier,
       ${GROUP_ELIGIBILITY_AWARDED_POINTS_EXPR} AS eligibility_awarded_points,
       ge.is_eligible,
       ge.reason_code,
       ge.evaluated_at
     FROM group_eligibility ge
     LEFT JOIN phases p ON p.phase_id = ge.phase_id
     LEFT JOIN sgroup g ON g.group_id = ge.group_id
     LEFT JOIN (
       SELECT group_id, COUNT(*) AS active_member_count
       FROM memberships
       WHERE status = 'ACTIVE'
       GROUP BY group_id
     ) mc
       ON mc.group_id = g.group_id
     LEFT JOIN group_eligibility_points gep
       ON gep.group_id = ge.group_id
      AND gep.phase_id = ge.phase_id
     WHERE ge.phase_id = ?
       AND ge.group_id = ?
     LIMIT 1`,
    [phaseId, Number(groupId)]
  );

  return rows[0] || null;
};

const getIndividualLeaderboard = async (limit = 30, filters = {}, executor) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const clauses = [];
  const values = [];

  if (filters?.tier) {
    clauses.push("g.tier = ?");
    values.push(String(filters.tier).toUpperCase());
  }

  const [rows] = await getExecutor(executor).query(
    `SELECT
       s.student_id,
       s.name,
       s.email,
       s.department,
       s.year,
       COALESCE(bph.total_base_points, bp.total_base_points, 0) AS total_base_points,
       m.group_id,
       m.role AS membership_role,
       g.group_code,
       g.group_name,
       g.tier AS group_tier
     FROM students s
     LEFT JOIN base_points bp ON bp.student_id = s.student_id
     LEFT JOIN (
       SELECT
         h.student_id,
         COALESCE(SUM(h.points), 0) AS total_base_points
       FROM base_point_history h
       GROUP BY h.student_id
     ) bph
       ON bph.student_id = s.student_id
     LEFT JOIN memberships m
       ON m.student_id = s.student_id
      AND m.status = 'ACTIVE'
     LEFT JOIN sgroup g ON g.group_id = m.group_id
     ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
     ORDER BY COALESCE(bph.total_base_points, bp.total_base_points, 0) DESC, s.student_id ASC
     LIMIT ?`,
    [...values, safeLimit]
  );
  return rows;
};

const getIndividualLeaderboardByPhase = async (startAt, endAt, limit = 30, filters = {}, executor) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const clauses = [];
  const values = [startAt, endAt];

  if (filters?.tier) {
    clauses.push("g.tier = ?");
    values.push(String(filters.tier).toUpperCase());
  }

  const [rows] = await getExecutor(executor).query(
    `SELECT
       s.student_id,
       s.name,
       s.email,
       s.department,
       s.year,
       COALESCE(SUM(h.points), 0) AS total_base_points,
       m.group_id,
       m.role AS membership_role,
       g.group_code,
       g.group_name,
       g.tier AS group_tier
     FROM students s
     LEFT JOIN memberships m
       ON m.student_id = s.student_id
      AND m.status = 'ACTIVE'
     LEFT JOIN sgroup g ON g.group_id = m.group_id
     LEFT JOIN base_point_history h
       ON h.student_id = s.student_id
      AND ${BASE_POINT_ACTIVITY_AT_EXPR} BETWEEN ? AND ?
     ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
     GROUP BY
       s.student_id, s.name, s.email, s.department, s.year,
       m.group_id, m.role, g.group_code, g.group_name, g.tier
     ORDER BY COALESCE(SUM(h.points), 0) DESC, s.student_id ASC
     LIMIT ?`,
    [...values, safeLimit]
  );
  return rows;
};

const getLeaderLeaderboard = async (roles = [], limit = 30, filters = {}, executor) => {
  const exec = getExecutor(executor);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const normalizedRoles = Array.isArray(roles)
    ? roles.map((role) => String(role || "").trim().toUpperCase()).filter(Boolean)
    : [];

  if (normalizedRoles.length === 0) return [];

  const placeholders = normalizedRoles.map(() => "?").join(", ");
  const values = [...normalizedRoles];
  let tierClause = "";
  if (filters?.tier) {
    tierClause = " AND g.tier = ?";
    values.push(String(filters.tier).toUpperCase());
  }

  const [rows] = await exec.query(
    `SELECT
       s.student_id,
       s.name,
       s.email,
       s.department,
       s.year,
       COALESCE(bph.total_base_points, bp.total_base_points, 0) AS total_base_points,
       m.membership_id,
       m.group_id,
       m.role AS membership_role,
       g.group_code,
       g.group_name,
       g.tier AS group_tier
     FROM memberships m
     INNER JOIN students s ON s.student_id = m.student_id
     LEFT JOIN base_points bp ON bp.student_id = s.student_id
     LEFT JOIN (
       SELECT
         h.student_id,
         COALESCE(SUM(h.points), 0) AS total_base_points
       FROM base_point_history h
       GROUP BY h.student_id
     ) bph
       ON bph.student_id = s.student_id
     LEFT JOIN sgroup g ON g.group_id = m.group_id
     WHERE m.status = 'ACTIVE'
       AND m.role IN (${placeholders})
       ${tierClause}
     ORDER BY COALESCE(bph.total_base_points, bp.total_base_points, 0) DESC, s.student_id ASC
     LIMIT ?`,
    [...values, safeLimit]
  );
  return rows;
};

const getLeaderLeaderboardByPhase = async (
  roles = [],
  startAt,
  endAt,
  limit = 30,
  filters = {},
  executor
) => {
  const exec = getExecutor(executor);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const normalizedRoles = Array.isArray(roles)
    ? roles.map((role) => String(role || "").trim().toUpperCase()).filter(Boolean)
    : [];

  if (normalizedRoles.length === 0) return [];

  const placeholders = normalizedRoles.map(() => "?").join(", ");
  let tierClause = "";
  if (filters?.tier) {
    tierClause = " AND g.tier = ?";
  }

  const [rows] = await exec.query(
    `SELECT
       s.student_id,
       s.name,
       s.email,
       s.department,
       s.year,
       COALESCE(SUM(h.points), 0) AS total_base_points,
       m.membership_id,
       m.group_id,
       m.role AS membership_role,
       g.group_code,
       g.group_name,
       g.tier AS group_tier
     FROM memberships m
     INNER JOIN students s ON s.student_id = m.student_id
     LEFT JOIN sgroup g ON g.group_id = m.group_id
     LEFT JOIN base_point_history h
       ON h.student_id = s.student_id
      AND ${BASE_POINT_ACTIVITY_AT_EXPR} BETWEEN ? AND ?
     WHERE m.status = 'ACTIVE'
       AND m.role IN (${placeholders})
       ${tierClause}
     GROUP BY
       s.student_id, s.name, s.email, s.department, s.year,
       m.membership_id, m.group_id, m.role, g.group_code, g.group_name, g.tier
     ORDER BY COALESCE(SUM(h.points), 0) DESC, s.student_id ASC
     LIMIT ?`,
    [
      startAt,
      endAt,
      ...normalizedRoles,
      ...(filters?.tier ? [String(filters.tier).toUpperCase()] : []),
      safeLimit
    ]
  );
  return rows;
};

const getGroupLeaderboard = async (limit = 30, filters = {}, executor) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const clauses = ["COALESCE(mc.active_member_count, 0) > 0"];
  const values = [];

  if (filters?.tier) {
    clauses.push("g.tier = ?");
    values.push(String(filters.tier).toUpperCase());
  }

  const excludedStatuses = Array.isArray(filters?.exclude_statuses)
    ? filters.exclude_statuses
        .map((status) => String(status || "").trim().toUpperCase())
        .filter(Boolean)
    : [];
  if (excludedStatuses.length > 0) {
    clauses.push(`UPPER(g.status) NOT IN (${excludedStatuses.map(() => "?").join(", ")})`);
    values.push(...excludedStatuses);
  }

  const [rows] = await getExecutor(executor).query(
    `SELECT
       g.group_id,
       g.group_code,
       g.group_name,
       g.tier,
       g.status AS group_status,
       COALESCE(mc.active_member_count, 0) AS active_member_count,
       COALESCE(gpt.total_base_points, 0) AS total_base_points
     FROM sgroup g
     LEFT JOIN (
       SELECT group_id, COUNT(*) AS active_member_count
       FROM memberships
       WHERE status = 'ACTIVE'
       GROUP BY group_id
     ) mc
       ON mc.group_id = g.group_id
     LEFT JOIN (
       SELECT
         gp.group_id,
         SUM(gp.points) AS total_base_points
       FROM group_points gp
       GROUP BY gp.group_id
     ) gpt
       ON gpt.group_id = g.group_id
     ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
     ORDER BY total_base_points DESC, active_member_count DESC, g.group_id ASC
     LIMIT ?`,
    [...values, safeLimit]
  );
  return rows;
};

const getGroupLeaderboardByPhase = async (startAt, endAt, limit = 30, filters = {}, executor) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const clauses = ["COALESCE(mc.active_member_count, 0) > 0"];
  const values = [startAt, endAt];

  if (filters?.tier) {
    clauses.push("g.tier = ?");
    values.push(String(filters.tier).toUpperCase());
  }

  const excludedStatuses = Array.isArray(filters?.exclude_statuses)
    ? filters.exclude_statuses
        .map((status) => String(status || "").trim().toUpperCase())
        .filter(Boolean)
    : [];
  if (excludedStatuses.length > 0) {
    clauses.push(`UPPER(g.status) NOT IN (${excludedStatuses.map(() => "?").join(", ")})`);
    values.push(...excludedStatuses);
  }

  const [rows] = await getExecutor(executor).query(
    `SELECT
       g.group_id,
       g.group_code,
       g.group_name,
       g.tier,
       g.status AS group_status,
       COALESCE(mc.active_member_count, 0) AS active_member_count,
       COALESCE(gpt.total_base_points, 0) AS total_base_points
     FROM sgroup g
     LEFT JOIN (
       SELECT group_id, COUNT(*) AS active_member_count
       FROM memberships
       WHERE status = 'ACTIVE'
       GROUP BY group_id
     ) mc
       ON mc.group_id = g.group_id
     LEFT JOIN (
       SELECT
         gp.group_id,
         SUM(gp.points) AS total_base_points
       FROM group_points gp
       WHERE ${GROUP_POINT_CREATED_AT_EXPR} BETWEEN ? AND ?
       GROUP BY gp.group_id
     ) gpt
       ON gpt.group_id = g.group_id
     ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
     ORDER BY total_base_points DESC, active_member_count DESC, g.group_id ASC
     LIMIT ?`,
    [...values, safeLimit]
  );
  return rows;
};

module.exports = {
  getPhaseById,
  getPhaseEligibilitySnapshotStats,
  getCurrentPhase,
  getIndividualTarget,
  getGroupTargets,
  getStudentPhasePoints,
  getStudentPhasePointsByStudent,
  getAllStudentsWithActiveGroupAndBasePoints,
  getGroupPhasePoints,
  getGroupPhaseSnapshot,
  upsertIndividualEligibility,
  upsertGroupEligibility,
  upsertIndividualEligibilityPoints,
  upsertGroupEligibilityPoints,
  recalculateIndividualEligibilityPointTotals,
  recalculateGroupEligibilityPointTotals,
  insertBasePointHistory,
  upsertBasePointsTotal,
  getStudentBasePoints,
  getStudentBasePointHistory,
  getIndividualEligibility,
  getGroupEligibility,
  getStudentByUserId,
  getStudentById,
  getStudentProfileById,
  getGroupById,
  getStudentEligiblePhaseCount,
  getGroupEligiblePhaseCount,
  getStudentMultiplierCounts,
  getGroupMultiplierCounts,
  getDashboardStudentStats,
  getDashboardGroupStats,
  getIndividualEligibilityPointTotal,
  getGroupEligibilityPointTotal,
  getMyIndividualEligibilityHistory,
  getStudentPhaseTimeline,
  getStoredGroupEligibilitySummary,
  listPhaseIdsMissingPointAllocations,
  listPhaseIdsWithEligibilitySnapshots,
  getIndividualLeaderboard,
  getIndividualLeaderboardByPhase,
  getLeaderLeaderboard,
  getLeaderLeaderboardByPhase,
  getGroupLeaderboard,
  getGroupLeaderboardByPhase
};
