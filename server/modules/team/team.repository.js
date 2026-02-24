const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const TEAM_SELECT_WITH_COUNTS = `
  SELECT
    t.team_id,
    t.event_id,
    t.team_code,
    t.team_name,
    t.team_type,
    t.status,
    t.description,
    t.created_by,
    t.created_at,
    t.updated_at,
    e.event_code,
    e.event_name,
    e.status AS event_status,
    e.start_date AS event_start_date,
    e.end_date AS event_end_date,
    COALESCE(mc.active_member_count, 0) AS active_member_count
  FROM teams t
  LEFT JOIN events e
    ON e.event_id = t.event_id
  LEFT JOIN (
    SELECT team_id, COUNT(*) AS active_member_count
    FROM team_membership
    WHERE status = 'ACTIVE'
    GROUP BY team_id
  ) mc
    ON mc.team_id = t.team_id
`;

const TEAM_ORDER_BY = `
  ORDER BY
    CASE t.status
      WHEN 'ACTIVE' THEN 1
      WHEN 'FROZEN' THEN 2
      WHEN 'INACTIVE' THEN 3
      WHEN 'ARCHIVED' THEN 4
      ELSE 5
    END,
    t.team_name ASC,
    t.team_id ASC
`;

const createTeam = async (team, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO teams
      (event_id, team_code, team_name, team_type, status, description, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      team.event_id ?? null,
      team.team_code,
      team.team_name,
      team.team_type,
      team.status,
      team.description || null,
      team.created_by || null
    ]
  );
  return result;
};

const getAllTeams = async (filters = {}, executor) => {
  const clauses = ["1=1"];
  const values = [];

  if (filters.event_id !== undefined) {
    if (filters.event_id === null) {
      clauses.push("t.event_id IS NULL");
    } else {
      clauses.push("t.event_id = ?");
      values.push(filters.event_id);
    }
  }

  const [rows] = await getExecutor(executor).query(
    `${TEAM_SELECT_WITH_COUNTS}
     WHERE ${clauses.join(" AND ")}
     ${TEAM_ORDER_BY}`,
    values
  );
  return rows;
};

const getTeamsByEventId = async (eventId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${TEAM_SELECT_WITH_COUNTS}
     WHERE t.event_id = ?
     ${TEAM_ORDER_BY}`,
    [eventId]
  );
  return rows;
};

const getTeamById = async (teamId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${TEAM_SELECT_WITH_COUNTS}
     WHERE t.team_id = ?
     LIMIT 1`,
    [teamId]
  );
  return rows[0] || null;
};

const getTeamByCode = async (teamCode, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       t.team_id,
       t.event_id,
       t.team_code,
       t.team_name,
       t.team_type,
       t.status
     FROM teams t
     WHERE t.team_code = ?
     LIMIT 1`,
    [teamCode]
  );
  return rows[0] || null;
};

const updateTeam = async (teamId, team, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE teams
     SET
       event_id = ?,
       team_code = ?,
       team_name = ?,
       team_type = ?,
       status = ?,
       description = ?
     WHERE team_id = ?`,
    [
      team.event_id ?? null,
      team.team_code,
      team.team_name,
      team.team_type,
      team.status,
      team.description || null,
      teamId
    ]
  );
  return result;
};

const setTeamStatus = async (teamId, status, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE teams
     SET status = ?
     WHERE team_id = ?`,
    [status, teamId]
  );
  return result;
};

const getStudentById = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT student_id, name, email
     FROM students
     WHERE student_id = ?
     LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
};

const getStudentByUserId = async (userId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT student_id, name, email
     FROM students
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

const createTeamMembership = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO team_membership
      (team_id, student_id, role, status, assigned_by, notes)
     VALUES (?, ?, ?, 'ACTIVE', ?, ?)`,
    [
      payload.team_id,
      payload.student_id,
      payload.role,
      payload.assigned_by || null,
      payload.notes || null
    ]
  );
  return result;
};

const getTeamMembershipById = async (membershipId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       tm.team_membership_id,
       tm.team_id,
       tm.student_id,
       tm.role,
       tm.status,
       tm.join_date,
       tm.leave_date,
       tm.assigned_by,
       tm.notes,
       tm.created_at,
       tm.updated_at,
       t.event_id,
       t.team_code,
       t.team_name,
       t.team_type,
       t.status AS team_status,
       e.event_code,
       e.event_name,
       e.status AS event_status,
       e.start_date AS event_start_date,
       e.end_date AS event_end_date,
       s.name AS student_name,
       s.email AS student_email,
       s.department,
       s.year
     FROM team_membership tm
     INNER JOIN teams t ON t.team_id = tm.team_id
     LEFT JOIN events e ON e.event_id = t.event_id
     INNER JOIN students s ON s.student_id = tm.student_id
     WHERE tm.team_membership_id = ?
     LIMIT 1`,
    [membershipId]
  );
  return rows[0] || null;
};

const findActiveTeamMembershipByTeamAndStudent = async (teamId, studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT team_membership_id, team_id, student_id, role, status
     FROM team_membership
     WHERE team_id = ? AND student_id = ? AND status = 'ACTIVE'
     LIMIT 1`,
    [teamId, studentId]
  );
  return rows[0] || null;
};

const findActiveTeamMembershipByStudentAndEvent = async (studentId, eventId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       tm.team_membership_id,
       tm.team_id,
       tm.student_id,
       tm.role,
       tm.status,
       t.event_id
     FROM team_membership tm
     INNER JOIN teams t ON t.team_id = tm.team_id
     WHERE tm.student_id = ?
       AND tm.status = 'ACTIVE'
       AND t.event_id = ?
     LIMIT 1`,
    [studentId, eventId]
  );
  return rows[0] || null;
};

const getTeamMembershipsByTeamId = async (teamId, filters = {}, executor) => {
  const clauses = ["tm.team_id = ?"];
  const values = [teamId];

  if (filters.status) {
    clauses.push("tm.status = ?");
    values.push(filters.status);
  }

  if (filters.student_id) {
    clauses.push("tm.student_id = ?");
    values.push(filters.student_id);
  }

  const [rows] = await getExecutor(executor).query(
    `SELECT
       tm.team_membership_id,
       tm.team_id,
       tm.student_id,
       tm.role,
       tm.status,
       tm.join_date,
       tm.leave_date,
       tm.assigned_by,
       tm.notes,
       tm.created_at,
       tm.updated_at,
       t.event_id,
       t.team_code,
       t.team_name,
       t.team_type,
       t.status AS team_status,
       e.event_code,
       e.event_name,
       e.status AS event_status,
       e.start_date AS event_start_date,
       e.end_date AS event_end_date,
       s.name AS student_name,
       s.email AS student_email,
       s.department,
       s.year
     FROM team_membership tm
     INNER JOIN teams t ON t.team_id = tm.team_id
     LEFT JOIN events e ON e.event_id = t.event_id
     INNER JOIN students s ON s.student_id = tm.student_id
     WHERE ${clauses.join(" AND ")}
     ORDER BY
       CASE tm.status WHEN 'ACTIVE' THEN 1 ELSE 2 END,
       tm.join_date DESC,
       tm.team_membership_id DESC`,
    values
  );
  return rows;
};

const getAllTeamMemberships = async (filters = {}, executor) => {
  const clauses = ["1=1"];
  const values = [];

  if (filters.status) {
    clauses.push("tm.status = ?");
    values.push(filters.status);
  }

  if (filters.team_id) {
    clauses.push("tm.team_id = ?");
    values.push(filters.team_id);
  }

  if (filters.student_id) {
    clauses.push("tm.student_id = ?");
    values.push(filters.student_id);
  }

  if (filters.event_id !== undefined) {
    clauses.push("t.event_id = ?");
    values.push(filters.event_id);
  }

  const [rows] = await getExecutor(executor).query(
    `SELECT
       tm.team_membership_id,
       tm.team_id,
       tm.student_id,
       tm.role,
       tm.status,
       tm.join_date,
       tm.leave_date,
       tm.assigned_by,
       tm.notes,
       tm.created_at,
       tm.updated_at,
       t.event_id,
       t.team_code,
       t.team_name,
       t.team_type,
       t.status AS team_status,
       e.event_code,
       e.event_name,
       e.status AS event_status,
       e.start_date AS event_start_date,
       e.end_date AS event_end_date,
       s.name AS student_name,
       s.email AS student_email,
       s.department,
       s.year
     FROM team_membership tm
     INNER JOIN teams t ON t.team_id = tm.team_id
     LEFT JOIN events e ON e.event_id = t.event_id
     INNER JOIN students s ON s.student_id = tm.student_id
     WHERE ${clauses.join(" AND ")}
     ORDER BY
       CASE tm.status WHEN 'ACTIVE' THEN 1 ELSE 2 END,
       tm.join_date DESC,
       tm.team_membership_id DESC`,
    values
  );
  return rows;
};

const updateTeamMembership = async (membershipId, payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE team_membership
     SET role = ?, notes = ?
     WHERE team_membership_id = ?`,
    [payload.role, payload.notes || null, membershipId]
  );
  return result;
};

const leaveTeamMembership = async (membershipId, payload = {}, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE team_membership
     SET
       status = 'LEFT',
       leave_date = NOW(),
       notes = COALESCE(?, notes)
     WHERE team_membership_id = ?
       AND status = 'ACTIVE'`,
    [payload.notes || null, membershipId]
  );
  return result;
};

module.exports = {
  createTeam,
  getAllTeams,
  getTeamsByEventId,
  getTeamById,
  getTeamByCode,
  updateTeam,
  setTeamStatus,
  getStudentById,
  getStudentByUserId,
  createTeamMembership,
  getTeamMembershipById,
  findActiveTeamMembershipByTeamAndStudent,
  findActiveTeamMembershipByStudentAndEvent,
  getTeamMembershipsByTeamId,
  getAllTeamMemberships,
  updateTeamMembership,
  leaveTeamMembership
};
