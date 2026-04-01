const db = require("../../config/db");

const insertAuditLog = async (payload, executor) => {
  const exec = executor || db;
  const [result] = await exec.query(
    `INSERT INTO audit_logs
      (action, entity_type, entity_id, actor_user_id, actor_role, reason_code, details_json, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.action,
      payload.entity_type,
      payload.entity_id ?? null,
      payload.actor_user_id ?? null,
      payload.actor_role ?? null,
      payload.reason_code ?? null,
      payload.details_json ?? null,
      payload.ip_address ?? null
    ]
  );
  return result.insertId;
};

const buildWhere = (filters = {}) => {
  const clauses = [];
  const values = [];

  if (filters.action) {
    clauses.push("al.action = ?");
    values.push(filters.action);
  }
  if (filters.entity_type) {
    clauses.push("al.entity_type = ?");
    values.push(filters.entity_type);
  }
  if (filters.actor_role) {
    clauses.push("al.actor_role = ?");
    values.push(filters.actor_role);
  }
  if (filters.actor_user_id !== undefined && filters.actor_user_id !== null) {
    clauses.push("al.actor_user_id = ?");
    values.push(filters.actor_user_id);
  }
  if (filters.from_date) {
    clauses.push("al.created_at >= ?");
    values.push(filters.from_date);
  }
  if (filters.to_date) {
    clauses.push("al.created_at <= ?");
    values.push(filters.to_date);
  }
  if (filters.q) {
    clauses.push(
      `(al.action LIKE ? OR al.entity_type LIKE ? OR al.entity_id LIKE ? OR al.reason_code LIKE ? OR al.details_json LIKE ? OR u.name LIKE ? OR a.admin_id LIKE ? OR s.student_id LIKE ?)`
    );
    const q = `%${filters.q}%`;
    values.push(q, q, q, q, q, q, q, q);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    values
  };
};

const listAuditLogs = async (filters = {}, paging = {}) => {
  const page = Math.max(1, Number(paging.page) || 1);
  const limit = Math.max(1, Math.min(Number(paging.limit) || 50, 200));
  const offset = (page - 1) * limit;
  const { whereSql, values } = buildWhere(filters);
  const fromSql = `
    FROM audit_logs al
    LEFT JOIN users u ON u.user_id = al.actor_user_id
    LEFT JOIN admins a ON a.user_id = al.actor_user_id
    LEFT JOIN students s ON s.user_id = al.actor_user_id
  `;

  const [rows] = await db.query(
    `SELECT
       al.audit_id,
       al.action,
       al.entity_type,
       al.entity_id,
       al.actor_user_id,
       al.actor_role,
       al.reason_code,
       al.details_json,
       al.ip_address,
       al.created_at,
       u.name AS actor_name,
       CASE
         WHEN u.role IN ('ADMIN', 'SYSTEM_ADMIN') THEN a.admin_id
         WHEN u.role = 'STUDENT' THEN s.student_id
         ELSE NULL
       END AS actor_reference_id,
       CASE
         WHEN u.role IN ('ADMIN', 'SYSTEM_ADMIN') THEN 'Admin ID'
         WHEN u.role = 'STUDENT' THEN 'Student ID'
         ELSE NULL
       END AS actor_reference_type
     ${fromSql}
     ${whereSql}
     ORDER BY al.created_at DESC, al.audit_id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  const [[countRow]] = await db.query(
    `SELECT COUNT(al.audit_id) AS total
     ${fromSql}
     ${whereSql}`,
    values
  );

  return {
    page,
    limit,
    total: Number(countRow?.total) || 0,
    rows
  };
};

module.exports = {
  insertAuditLog,
  listAuditLogs
};
