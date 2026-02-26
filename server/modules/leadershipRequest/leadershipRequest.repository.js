const db = require("../../config/db");
// leadership_role_requests table is managed via manual SQL migration (DB-first).
// This repository assumes the table already exists with the required indexes/foreign keys.

const createRequestTx = async (conn, payload) => {
  const [result] = await conn.query(
    `INSERT INTO leadership_role_requests
      (membership_id, student_id, group_id, requested_role, request_reason)
     VALUES (?, ?, ?, ?, ?)`,
    [
      payload.membership_id,
      payload.student_id,
      payload.group_id,
      payload.requested_role,
      payload.request_reason || null
    ]
  );

  return { leadership_request_id: result.insertId };
};

const findPendingByStudentAndGroupTx = async (conn, studentId, groupId) => {
  const [rows] = await conn.query(
    `SELECT *
     FROM leadership_role_requests
     WHERE student_id=? AND group_id=? AND status='PENDING'
     ORDER BY leadership_request_id DESC
     LIMIT 1
     FOR UPDATE`,
    [studentId, groupId]
  );
  return rows[0] || null;
};

const findByIdTx = async (conn, requestId) => {
  const [rows] = await conn.query(
    `SELECT *
     FROM leadership_role_requests
     WHERE leadership_request_id=?
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
  decisionReason,
  decisionByAdminId
) => {
  await conn.query(
    `UPDATE leadership_role_requests
     SET status=?,
         decision_reason=?,
         decision_by_admin_id=?,
         decision_date=NOW()
     WHERE leadership_request_id=?`,
    [status, decisionReason, decisionByAdminId, requestId]
  );
};

const findPendingByGroup = async (groupId) => {
  const [rows] = await db.query(
    `SELECT
       lrr.*,
       s.name AS student_name,
       s.email AS student_email,
       m.role AS current_membership_role,
       m.status AS current_membership_status
     FROM leadership_role_requests lrr
     LEFT JOIN students s ON s.student_id = lrr.student_id
     LEFT JOIN memberships m ON m.membership_id = lrr.membership_id
     WHERE lrr.group_id=? AND lrr.status='PENDING'
     ORDER BY lrr.request_date ASC, lrr.leadership_request_id ASC`,
    [groupId]
  );
  return rows;
};

const findAllPending = async () => {
  const [rows] = await db.query(
    `SELECT
       lrr.*,
       s.name AS student_name,
       s.email AS student_email,
       m.role AS current_membership_role,
       m.status AS current_membership_status,
       g.group_code,
       g.group_name,
       g.tier AS group_tier,
       g.status AS group_status
     FROM leadership_role_requests lrr
     LEFT JOIN students s ON s.student_id = lrr.student_id
     LEFT JOIN memberships m ON m.membership_id = lrr.membership_id
     LEFT JOIN Sgroup g ON g.group_id = lrr.group_id
     WHERE lrr.status='PENDING'
     ORDER BY lrr.request_date ASC, lrr.leadership_request_id ASC`
  );
  return rows;
};

const findByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT lrr.*
     FROM leadership_role_requests lrr
     WHERE lrr.student_id=?
     ORDER BY lrr.request_date DESC, lrr.leadership_request_id DESC`,
    [studentId]
  );
  return rows;
};

const countPendingRequests = async () => {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS count
     FROM leadership_role_requests
     WHERE status='PENDING'`
  );
  return Number(row?.count) || 0;
};

const listGroupsWithoutLeadership = async (limit = 10) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
  const [rows] = await db.query(
    `SELECT
       g.group_id,
       g.group_code,
       g.group_name,
       g.status,
       COALESCE(ms.active_member_count, 0) AS active_member_count,
       COALESCE(ms.active_leadership_count, 0) AS active_leadership_count,
       COALESCE(pr.pending_request_count, 0) AS pending_request_count
     FROM Sgroup g
     LEFT JOIN (
       SELECT
         m.group_id,
         COUNT(*) AS active_member_count,
         SUM(
           CASE
             WHEN m.role IN ('CAPTAIN','VICE_CAPTAIN','STRATEGIST','MANAGER') THEN 1
             ELSE 0
           END
         ) AS active_leadership_count
       FROM memberships m
       WHERE m.status='ACTIVE'
       GROUP BY m.group_id
     ) ms
       ON ms.group_id = g.group_id
     LEFT JOIN (
       SELECT l.group_id, COUNT(*) AS pending_request_count
       FROM leadership_role_requests l
       WHERE l.status='PENDING'
       GROUP BY l.group_id
     ) pr
       ON pr.group_id = g.group_id
     WHERE COALESCE(ms.active_member_count, 0) > 0
       AND COALESCE(ms.active_leadership_count, 0) = 0
     ORDER BY
       COALESCE(pr.pending_request_count, 0) DESC,
       COALESCE(ms.active_member_count, 0) DESC,
       g.group_id ASC
     LIMIT ?`,
    [safeLimit]
  );
  return rows;
};

const countGroupsWithoutLeadership = async () => {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS count
     FROM (
       SELECT
         m.group_id
       FROM memberships m
       WHERE m.status='ACTIVE'
       GROUP BY m.group_id
       HAVING SUM(
         CASE
           WHEN m.role IN ('CAPTAIN','VICE_CAPTAIN','STRATEGIST','MANAGER') THEN 1
           ELSE 0
         END
       ) = 0
     ) t`
  );
  return Number(row?.count) || 0;
};

module.exports = {
  createRequestTx,
  findPendingByStudentAndGroupTx,
  findByIdTx,
  updateDecisionTx,
  findPendingByGroup,
  findAllPending,
  findByStudent,
  countPendingRequests,
  listGroupsWithoutLeadership,
  countGroupsWithoutLeadership
};
