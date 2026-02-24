const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const createRequest = async (studentId, teamId, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO event_join_request (student_id, team_id)
     VALUES (?, ?)`,
    [studentId, teamId]
  );

  return { event_request_id: result.insertId };
};

const findPendingRequest = async (studentId, teamId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT *
     FROM event_join_request
     WHERE student_id = ? AND team_id = ? AND status = 'PENDING'
     LIMIT 1`,
    [studentId, teamId]
  );
  return rows[0] || null;
};

const findByIdTx = async (conn, requestId) => {
  const [rows] = await conn.query(
    `SELECT *
     FROM event_join_request
     WHERE event_request_id = ?
     LIMIT 1
     FOR UPDATE`,
    [requestId]
  );
  return rows[0] || null;
};

const updateDecisionTx = async (
  conn,
  requestId,
  status,
  reason,
  decisionByUserId,
  decisionByRole
) => {
  await conn.query(
    `UPDATE event_join_request
     SET
       status = ?,
       decision_reason = ?,
       decision_by_user_id = ?,
       decision_by_role = ?,
       decision_date = NOW()
     WHERE event_request_id = ?`,
    [status, reason || null, decisionByUserId || null, decisionByRole || null, requestId]
  );
};

const findPendingByTeam = async (teamId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       ejr.event_request_id,
       ejr.student_id,
       ejr.team_id,
       ejr.request_date,
       ejr.status,
       ejr.decision_by_user_id,
       ejr.decision_by_role,
       ejr.decision_reason,
       ejr.decision_date,
       t.event_id,
       t.team_code,
       t.team_name,
       t.team_type,
       t.status AS team_status,
       e.event_code,
       e.event_name,
       e.status AS event_status,
       s.name AS student_name,
       s.email AS student_email,
       s.department,
       s.year
     FROM event_join_request ejr
     LEFT JOIN teams t ON t.team_id = ejr.team_id
     LEFT JOIN events e ON e.event_id = t.event_id
     LEFT JOIN students s ON s.student_id = ejr.student_id
     WHERE ejr.team_id = ? AND ejr.status = 'PENDING'
     ORDER BY ejr.request_date ASC, ejr.event_request_id ASC`,
    [teamId]
  );
  return rows;
};

const findByStudent = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       ejr.event_request_id,
       ejr.student_id,
       ejr.team_id,
       ejr.request_date,
       ejr.status,
       ejr.decision_by_user_id,
       ejr.decision_by_role,
       ejr.decision_reason,
       ejr.decision_date,
       t.event_id,
       t.team_code,
       t.team_name,
       t.team_type,
       t.status AS team_status,
       e.event_code,
       e.event_name,
       e.status AS event_status
     FROM event_join_request ejr
     LEFT JOIN teams t ON t.team_id = ejr.team_id
     LEFT JOIN events e ON e.event_id = t.event_id
     WHERE ejr.student_id = ?
     ORDER BY ejr.request_date DESC, ejr.event_request_id DESC`,
    [studentId]
  );
  return rows;
};

module.exports = {
  createRequest,
  findPendingRequest,
  findByIdTx,
  updateDecisionTx,
  findPendingByTeam,
  findByStudent
};
