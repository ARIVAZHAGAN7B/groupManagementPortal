const db = require("../../config/db");
// group_tier_change_requests table is managed via manual SQL migration (DB-first).

const createRequestTx = async (conn, payload) => {
  const [result] = await conn.query(
    `INSERT INTO group_tier_change_requests (
      group_id,
      current_tier,
      requested_tier,
      request_type,
      requested_by_user_role,
      requested_by_student_id,
      requested_by_admin_id,
      request_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.group_id,
      payload.current_tier,
      payload.requested_tier,
      payload.request_type,
      payload.requested_by_user_role,
      payload.requested_by_student_id || null,
      payload.requested_by_admin_id || null,
      payload.request_reason || null
    ]
  );

  return { tier_change_request_id: result.insertId };
};

const findPendingByGroupTx = async (conn, groupId) => {
  const [rows] = await conn.query(
    `SELECT *
     FROM group_tier_change_requests
     WHERE group_id=? AND status='PENDING'
     ORDER BY tier_change_request_id DESC
     LIMIT 1
     FOR UPDATE`,
    [groupId]
  );
  return rows[0] || null;
};

const findByIdTx = async (conn, requestId) => {
  const [rows] = await conn.query(
    `SELECT *
     FROM group_tier_change_requests
     WHERE tier_change_request_id=?
     LIMIT 1
     FOR UPDATE`,
    [requestId]
  );
  return rows[0] || null;
};

const updateDecisionTx = async (conn, requestId, payload) => {
  await conn.query(
    `UPDATE group_tier_change_requests
     SET status=?,
         decision_by_admin_id=?,
         decision_reason=?,
         decision_date=NOW()
     WHERE tier_change_request_id=?`,
    [
      payload.status,
      payload.decision_by_admin_id || null,
      payload.decision_reason || null,
      requestId
    ]
  );
};

const findAllPending = async () => {
  const [rows] = await db.query(
    `SELECT
       r.*,
       g.group_code,
       g.group_name,
       g.tier AS live_group_tier,
       g.status AS group_status,
       s.name AS requested_by_student_name,
       s.email AS requested_by_student_email,
       a.name AS requested_by_admin_name,
       a.email AS requested_by_admin_email
     FROM group_tier_change_requests r
     LEFT JOIN Sgroup g ON g.group_id = r.group_id
     LEFT JOIN students s ON s.student_id = r.requested_by_student_id
     LEFT JOIN admins a ON a.admin_id = r.requested_by_admin_id
     WHERE r.status='PENDING'
     ORDER BY r.request_date ASC, r.tier_change_request_id ASC`
  );
  return rows;
};

const findPendingByGroup = async (groupId) => {
  const [rows] = await db.query(
    `SELECT
       r.*,
       g.group_code,
       g.group_name,
       g.tier AS live_group_tier,
       g.status AS group_status,
       s.name AS requested_by_student_name,
       s.email AS requested_by_student_email,
       a.name AS requested_by_admin_name,
       a.email AS requested_by_admin_email
     FROM group_tier_change_requests r
     LEFT JOIN Sgroup g ON g.group_id = r.group_id
     LEFT JOIN students s ON s.student_id = r.requested_by_student_id
     LEFT JOIN admins a ON a.admin_id = r.requested_by_admin_id
     WHERE r.group_id=? AND r.status='PENDING'
     ORDER BY r.request_date ASC, r.tier_change_request_id ASC`,
    [groupId]
  );
  return rows;
};

const findByRequesterStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT
       r.*,
       g.group_code,
       g.group_name,
       g.status AS group_status
     FROM group_tier_change_requests r
     LEFT JOIN Sgroup g ON g.group_id = r.group_id
     WHERE r.requested_by_student_id=?
     ORDER BY r.request_date DESC, r.tier_change_request_id DESC`,
    [studentId]
  );
  return rows;
};

const countPendingRequests = async () => {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS count
     FROM group_tier_change_requests
     WHERE status='PENDING'`
  );
  return Number(row?.count) || 0;
};

module.exports = {
  createRequestTx,
  findPendingByGroupTx,
  findByIdTx,
  updateDecisionTx,
  findAllPending,
  findPendingByGroup,
  findByRequesterStudent,
  countPendingRequests
};

