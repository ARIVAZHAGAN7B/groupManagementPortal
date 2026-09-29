const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const insertSyncLog = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO activity_points_write_log (
       sync_type,
       entity_key,
       phase_id,
       student_id,
       group_id,
       payload_json,
       connection_mode,
       status,
       source_module,
       synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      payload.sync_type,
      payload.entity_key,
      payload.phase_id || null,
      payload.student_id || null,
      payload.group_id === undefined || payload.group_id === null ? null : Number(payload.group_id),
      JSON.stringify(payload.payload_json || {}),
      payload.connection_mode || "MIMICKED_INTERNAL",
      payload.status || "SYNCED",
      payload.source_module || null
    ]
  );

  return result.insertId;
};

const insertSyncLogs = async (payloads = [], executor) => {
  const rows = Array.isArray(payloads) ? payloads : [];
  if (rows.length === 0) return;

  const placeholders = rows.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())").join(", ");
  const values = rows.flatMap((payload) => [
    payload.sync_type,
    payload.entity_key,
    payload.phase_id || null,
    payload.student_id || null,
    payload.group_id === undefined || payload.group_id === null ? null : Number(payload.group_id),
    JSON.stringify(payload.payload_json || {}),
    payload.connection_mode || "MIMICKED_INTERNAL",
    payload.status || "SYNCED",
    payload.source_module || null
  ]);

  await getExecutor(executor).query(
    `INSERT INTO activity_points_write_log (
       sync_type,
       entity_key,
       phase_id,
       student_id,
       group_id,
       payload_json,
       connection_mode,
       status,
       source_module,
       synced_at
     ) VALUES ${placeholders}`,
    values
  );
};

const getSyncLogById = async (syncLogId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT *
     FROM activity_points_write_log
     WHERE activity_points_write_log_id = ?
     LIMIT 1`,
    [Number(syncLogId)]
  );
  return rows[0] || null;
};

const listSyncLogs = async (filters = {}, options = {}, executor) => {
  const clauses = ["1=1"];
  const values = [];

  if (filters.sync_type) {
    clauses.push("sync_type = ?");
    values.push(String(filters.sync_type).trim().toUpperCase());
  }

  if (filters.phase_id) {
    clauses.push("phase_id = ?");
    values.push(String(filters.phase_id).trim());
  }

  if (filters.student_id) {
    clauses.push("student_id = ?");
    values.push(String(filters.student_id).trim());
  }

  if (filters.group_id !== undefined && filters.group_id !== null && filters.group_id !== "") {
    clauses.push("group_id = ?");
    values.push(Number(filters.group_id));
  }

  if (filters.status) {
    clauses.push("status = ?");
    values.push(String(filters.status).trim().toUpperCase());
  }

  if (filters.source_module) {
    clauses.push("source_module = ?");
    values.push(String(filters.source_module).trim());
  }

  const limit = Math.max(1, Math.min(Number(options.limit) || 50, 200));
  const offset = Math.max(0, Number(options.offset) || 0);

  const [[countRow]] = await getExecutor(executor).query(
    `SELECT COUNT(*) AS total
     FROM activity_points_write_log
     WHERE ${clauses.join(" AND ")}`,
    values
  );

  const [rows] = await getExecutor(executor).query(
    `SELECT *
     FROM activity_points_write_log
     WHERE ${clauses.join(" AND ")}
     ORDER BY synced_at DESC, activity_points_write_log_id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return {
    rows,
    total: Number(countRow?.total) || 0
  };
};

module.exports = {
  insertSyncLog,
  insertSyncLogs,
  getSyncLogById,
  listSyncLogs
};
