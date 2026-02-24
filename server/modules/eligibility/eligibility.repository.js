const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const getPhaseById = async (phaseId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT phase_id, start_date, end_date
     FROM phases
     WHERE phase_id = ?
     LIMIT 1`,
    [phaseId]
  );
  return rows[0] || null;
};

const getCurrentPhase = async (executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT phase_id, start_date, end_date
     FROM phases
     WHERE status = 'ACTIVE'
     ORDER BY start_date DESC
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
      AND h.activity_date BETWEEN ? AND ?
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
      AND h.activity_date BETWEEN ? AND ?
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
       COALESCE(bp.total_base_points, 0) AS total_base_points,
       bp.last_updated AS base_points_last_updated,
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
     LEFT JOIN memberships m
       ON m.student_id = s.student_id
      AND m.status = 'ACTIVE'
     LEFT JOIN Sgroup g
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
       COALESCE(SUM(h.points), 0) AS this_phase_group_points
     FROM Sgroup g
     LEFT JOIN memberships m
       ON m.group_id = g.group_id
      AND m.status = 'ACTIVE'
     LEFT JOIN base_point_history h
       ON h.student_id = m.student_id
      AND h.activity_date BETWEEN ? AND ?
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
       COUNT(DISTINCT m.membership_id) AS active_member_count,
       COALESCE(SUM(COALESCE(h.points, 0)), 0) AS earned_points
     FROM Sgroup g
     LEFT JOIN memberships m
       ON m.group_id = g.group_id
      AND m.status = 'ACTIVE'
     LEFT JOIN base_point_history h
       ON h.student_id = m.student_id
      AND h.activity_date BETWEEN ? AND ?
     WHERE g.group_id = ?
     GROUP BY g.group_id, g.group_code, g.group_name, g.tier, g.status
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

const insertBasePointHistory = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO base_point_history
      (student_id, activity_date, points, reason, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [payload.student_id, payload.activity_date, payload.points, payload.reason]
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
    `SELECT student_id, total_base_points, last_updated
     FROM base_points
     WHERE student_id = ?
     LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
};

const getStudentBasePointHistory = async (studentId, limit = 50, executor) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const [rows] = await getExecutor(executor).query(
    `SELECT history_id, student_id, activity_date, points, reason, created_at
     FROM base_point_history
     WHERE student_id = ?
     ORDER BY activity_date DESC, history_id DESC
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
       ie.this_phase_base_points,
       ie.is_eligible,
       ie.reason_code,
       ie.evaluated_at,
       s.name AS student_name,
       s.department,
       s.year
     FROM individual_eligibility ie
     LEFT JOIN students s ON s.student_id = ie.student_id
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
       ge.this_phase_group_points,
       ge.is_eligible,
       ge.reason_code,
       ge.evaluated_at,
       g.group_code,
       g.group_name,
       g.tier
     FROM group_eligibility ge
     LEFT JOIN Sgroup g ON g.group_id = ge.group_id
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

const getMyIndividualEligibilityHistory = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       ie.eligibility_id,
       ie.student_id,
       ie.phase_id,
       ie.this_phase_base_points,
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
     LEFT JOIN phases p ON p.phase_id = ie.phase_id
     WHERE ie.student_id = ?
     ORDER BY p.start_date DESC, ie.evaluated_at DESC, ie.eligibility_id DESC`,
    [studentId]
  );
  return rows;
};

const getIndividualLeaderboard = async (limit = 30, executor) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const [rows] = await getExecutor(executor).query(
    `SELECT
       s.student_id,
       s.name,
       s.email,
       s.department,
       s.year,
       COALESCE(bp.total_base_points, 0) AS total_base_points,
       m.group_id,
       m.role AS membership_role,
       g.group_code,
       g.group_name,
       g.tier AS group_tier
     FROM students s
     LEFT JOIN base_points bp ON bp.student_id = s.student_id
     LEFT JOIN memberships m
       ON m.student_id = s.student_id
      AND m.status = 'ACTIVE'
     LEFT JOIN Sgroup g ON g.group_id = m.group_id
     ORDER BY COALESCE(bp.total_base_points, 0) DESC, s.student_id ASC
     LIMIT ?`,
    [safeLimit]
  );
  return rows;
};

const getLeaderLeaderboard = async (roles = [], limit = 30, executor) => {
  const exec = getExecutor(executor);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const normalizedRoles = Array.isArray(roles)
    ? roles.map((role) => String(role || "").trim().toUpperCase()).filter(Boolean)
    : [];

  if (normalizedRoles.length === 0) return [];

  const placeholders = normalizedRoles.map(() => "?").join(", ");
  const [rows] = await exec.query(
    `SELECT
       s.student_id,
       s.name,
       s.email,
       s.department,
       s.year,
       COALESCE(bp.total_base_points, 0) AS total_base_points,
       m.membership_id,
       m.group_id,
       m.role AS membership_role,
       g.group_code,
       g.group_name,
       g.tier AS group_tier
     FROM memberships m
     INNER JOIN students s ON s.student_id = m.student_id
     LEFT JOIN base_points bp ON bp.student_id = s.student_id
     LEFT JOIN Sgroup g ON g.group_id = m.group_id
     WHERE m.status = 'ACTIVE'
       AND m.role IN (${placeholders})
     ORDER BY COALESCE(bp.total_base_points, 0) DESC, s.student_id ASC
     LIMIT ?`,
    [...normalizedRoles, safeLimit]
  );
  return rows;
};

const getGroupLeaderboard = async (limit = 30, executor) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const [rows] = await getExecutor(executor).query(
    `SELECT
       g.group_id,
       g.group_code,
       g.group_name,
       g.tier,
       g.status AS group_status,
       COUNT(m.membership_id) AS active_member_count,
       COALESCE(SUM(COALESCE(bp.total_base_points, 0)), 0) AS total_base_points
     FROM Sgroup g
     INNER JOIN memberships m
       ON m.group_id = g.group_id
      AND m.status = 'ACTIVE'
     LEFT JOIN base_points bp ON bp.student_id = m.student_id
     GROUP BY g.group_id, g.group_code, g.group_name, g.tier, g.status
     ORDER BY total_base_points DESC, active_member_count DESC, g.group_id ASC
     LIMIT ?`,
    [safeLimit]
  );
  return rows;
};

module.exports = {
  getPhaseById,
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
  insertBasePointHistory,
  upsertBasePointsTotal,
  getStudentBasePoints,
  getStudentBasePointHistory,
  getIndividualEligibility,
  getGroupEligibility,
  getStudentByUserId,
  getStudentById,
  getMyIndividualEligibilityHistory,
  getIndividualLeaderboard,
  getLeaderLeaderboard,
  getGroupLeaderboard
};
