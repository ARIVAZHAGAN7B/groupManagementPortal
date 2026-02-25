const db = require("../../config/db");

let ensurePromise = null;

const ensureSchema = async () => {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
          action VARCHAR(120) NOT NULL,
          entity_type VARCHAR(120) NOT NULL,
          entity_id VARCHAR(120) NULL,
          actor_user_id BIGINT NULL,
          actor_role VARCHAR(60) NULL,
          reason_code VARCHAR(120) NULL,
          details_json LONGTEXT NULL,
          ip_address VARCHAR(128) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_audit_created_at (created_at),
          INDEX idx_audit_action (action),
          INDEX idx_audit_entity (entity_type, entity_id),
          INDEX idx_audit_actor (actor_user_id, actor_role)
        )
      `);
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
};

const insertAuditLog = async (payload, executor) => {
  await ensureSchema();
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
    clauses.push("action = ?");
    values.push(filters.action);
  }
  if (filters.entity_type) {
    clauses.push("entity_type = ?");
    values.push(filters.entity_type);
  }
  if (filters.actor_role) {
    clauses.push("actor_role = ?");
    values.push(filters.actor_role);
  }
  if (filters.actor_user_id !== undefined && filters.actor_user_id !== null) {
    clauses.push("actor_user_id = ?");
    values.push(filters.actor_user_id);
  }
  if (filters.from_date) {
    clauses.push("created_at >= ?");
    values.push(filters.from_date);
  }
  if (filters.to_date) {
    clauses.push("created_at <= ?");
    values.push(filters.to_date);
  }
  if (filters.q) {
    clauses.push(
      `(action LIKE ? OR entity_type LIKE ? OR entity_id LIKE ? OR reason_code LIKE ? OR details_json LIKE ?)`
    );
    const q = `%${filters.q}%`;
    values.push(q, q, q, q, q);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    values
  };
};

const listAuditLogs = async (filters = {}, paging = {}) => {
  await ensureSchema();
  const page = Math.max(1, Number(paging.page) || 1);
  const limit = Math.max(1, Math.min(Number(paging.limit) || 50, 200));
  const offset = (page - 1) * limit;
  const { whereSql, values } = buildWhere(filters);

  const [rows] = await db.query(
    `SELECT
       audit_id,
       action,
       entity_type,
       entity_id,
       actor_user_id,
       actor_role,
       reason_code,
       details_json,
       ip_address,
       created_at
     FROM audit_logs
     ${whereSql}
     ORDER BY created_at DESC, audit_id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  const [[countRow]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM audit_logs
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
  ensureSchema,
  insertAuditLog,
  listAuditLogs
};
