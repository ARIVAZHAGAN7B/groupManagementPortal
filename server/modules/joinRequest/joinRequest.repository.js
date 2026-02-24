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

// Update decision
exports.updateDecision = async (id, status, reason, decisionBy) => {
  await db.query(
    `UPDATE join_requests
     SET status=?, decision_reason=?, decision_by=?, decision_date=NOW()
     WHERE request_id=?`,
    [status, reason, decisionBy, id]
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
    `SELECT * FROM join_requests
     WHERE group_id=? AND status='PENDING'`,
    [groupId]
  );
  return rows;
};

// Student requests
exports.findByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT * FROM join_requests WHERE student_id=?`,
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

exports.updateDecisionTx = async (conn, id, status, reason, decisionBy) => {
  await conn.query(
    `UPDATE join_requests
     SET status=?, decision_reason=?, decision_by=?, decision_date=NOW()
     WHERE request_id=?`,
    [status, reason, decisionBy, id]
  );
};

