const db = require("../../config/db");

// Create request
exports.createJoinRequest = async (studentId, groupId) => {
  const [result] = await db.query(
    `INSERT INTO join_requests (student_id, group_id)
     VALUES (?, ?)`,
    [studentId, groupId]
  );
  return { request_id: result.insertId };
};

// Find pending request
exports.findPendingRequest = async (studentId, groupId) => {
  const [rows] = await db.query(
    `SELECT * FROM join_requests 
     WHERE student_id=? AND group_id=? AND status='PENDING'`,
    [studentId, groupId]
  );
  return rows[0];
};

// Find by id
exports.findById = async (requestId) => {
  const [rows] = await db.query(
    `SELECT * FROM join_requests WHERE request_id=?`,
    [requestId]
  );
  return rows[0];
};

exports.findGroupById = async (groupId) => {
  const [rows] = await db.query(
    `SELECT
       group_id,
       group_code,
       group_name,
       status,
       accepting_applications,
       joining_conditions
     FROM sgroup
     WHERE group_id=?`,
    [groupId]
  );
  return rows[0];
};

// Update decision
exports.updateDecision = async (
  id,
  status,
  reason,
  decisionBy,
  decisionByUserId,
  decisionByRole,
  approvedRole
) => {
  await db.query(
    `UPDATE join_requests
     SET
       status=?,
       decision_reason=?,
       decision_by=?,
       decision_by_user_id=?,
       decision_by_role=?,
       approved_role=?,
       decision_date=NOW()
     WHERE request_id=?`,
    [status, reason, decisionBy, decisionByUserId, decisionByRole, approvedRole, id]
  );
};

// Add to membership table
exports.addMemberToGroup = async (studentId, groupId) => {
  await db.query(
    `INSERT INTO memberships (student_id, group_id, role, join_date)
     VALUES (?, ?, 'MEMBER', NOW())`,
    [studentId, groupId]
  );
};

// Pending requests by group
exports.findPendingByGroup = async (groupId) => {
  const [rows] = await db.query(
    `SELECT
       jr.request_id,
       jr.student_id,
       jr.group_id,
       jr.status,
       jr.request_date,
       jr.decision_reason,
       jr.decision_by,
       jr.decision_by_user_id,
       jr.decision_by_role,
       jr.approved_role,
       jr.decision_date,
       s.name AS student_name,
       s.email AS student_email,
       s.department,
       s.year,
       g.group_code,
       g.group_name,
       g.tier AS group_tier
     FROM join_requests jr
     LEFT JOIN students s ON s.student_id = jr.student_id
     LEFT JOIN sgroup g ON g.group_id = jr.group_id
     WHERE jr.group_id=? AND jr.status='PENDING'
     ORDER BY jr.request_date ASC, jr.request_id ASC`,
    [groupId]
  );
  return rows;
};

// Student requests
exports.findByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT
       jr.request_id,
       jr.student_id,
       jr.group_id,
       jr.status,
       jr.request_date,
       jr.decision_reason,
       jr.decision_by,
       jr.decision_by_user_id,
       jr.decision_by_role,
       jr.approved_role,
       jr.decision_date,
       g.group_code,
       g.group_name,
       g.tier AS group_tier,
       g.status AS group_status
     FROM join_requests jr
     LEFT JOIN sgroup g ON g.group_id = jr.group_id
     WHERE jr.student_id=?
     ORDER BY jr.request_date DESC, jr.request_id DESC`,
    [studentId]
  );
  return rows;
};


// Tx versions
exports.findByIdTx = async (conn, requestId) => {
  const [rows] = await conn.query(
    "SELECT * FROM join_requests WHERE request_id=?",
    [requestId]
  );
  return rows[0];
};

exports.updateDecisionTx = async (
  conn,
  id,
  status,
  reason,
  decisionBy,
  decisionByUserId,
  decisionByRole,
  approvedRole
) => {
  await conn.query(
    `UPDATE join_requests
     SET
       status=?,
       decision_reason=?,
       decision_by=?,
       decision_by_user_id=?,
       decision_by_role=?,
       approved_role=?,
       decision_date=NOW()
     WHERE request_id=?`,
    [status, reason, decisionBy, decisionByUserId, decisionByRole, approvedRole, id]
  );
};

