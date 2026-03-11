const db = require("../../config/db");

const getExecutor = (executor) => executor || db;
const REQUIRED_PHASE_STATUSES = ["ACTIVE", "INACTIVE", "COMPLETED"];
let ensurePhaseStatusColumnPromise = null;

const parseEnumValues = (columnType) => {
  const matches = String(columnType || "").match(/'((?:''|[^'])*)'/g) || [];
  return matches.map((token) => token.slice(1, -1).replace(/''/g, "'"));
};

const escapeSqlString = (value) => String(value).replace(/'/g, "''");

const ensurePhaseStatusColumn = async () => {
  if (ensurePhaseStatusColumnPromise) return ensurePhaseStatusColumnPromise;

  ensurePhaseStatusColumnPromise = (async () => {
    const [rows] = await db.execute(
      `SELECT DATA_TYPE, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'phases'
         AND COLUMN_NAME = 'status'
       LIMIT 1`
    );

    const column = rows?.[0];
    if (!column) return;
    if (String(column.DATA_TYPE || "").toLowerCase() !== "enum") return;

    const existingValues = parseEnumValues(column.COLUMN_TYPE);
    if (existingValues.length === 0) return;

    const existingUpper = new Set(existingValues.map((value) => String(value).toUpperCase()));
    const mergedValues = [...existingValues];
    for (const status of REQUIRED_PHASE_STATUSES) {
      if (!existingUpper.has(status)) {
        mergedValues.push(status);
      }
    }

    if (mergedValues.length === existingValues.length) return;

    const currentDefault =
      column.COLUMN_DEFAULT === null || column.COLUMN_DEFAULT === undefined
        ? null
        : String(column.COLUMN_DEFAULT);
    const defaultValue =
      currentDefault &&
      mergedValues.find(
        (value) => String(value).toUpperCase() === String(currentDefault).toUpperCase()
      );
    const effectiveDefault =
      defaultValue ||
      mergedValues.find((value) => String(value).toUpperCase() === "INACTIVE") ||
      mergedValues[0];
    const isNullable = String(column.IS_NULLABLE || "").toUpperCase() === "YES";

    const enumValuesSql = mergedValues
      .map((value) => `'${escapeSqlString(value)}'`)
      .join(", ");
    const nullabilitySql = isNullable ? "NULL" : "NOT NULL";
    const defaultSql =
      effectiveDefault === null || effectiveDefault === undefined
        ? ""
        : ` DEFAULT '${escapeSqlString(effectiveDefault)}'`;

    await db.execute(
      `ALTER TABLE phases
       MODIFY COLUMN status ENUM(${enumValuesSql}) ${nullabilitySql}${defaultSql}`
    );
  })().catch((error) => {
    ensurePhaseStatusColumnPromise = null;
    throw error;
  });

  return ensurePhaseStatusColumnPromise;
};

exports.insertPhase = async (phase, executor) => {
  await ensurePhaseStatusColumn();
  const sql = `
    INSERT INTO phases (
      phase_id,
      phase_name,
      start_date,
      end_date,
      total_working_days,
      change_day_number,
      change_day,
      start_time,
      end_time,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await getExecutor(executor).execute(sql, [
    phase.phase_id,
    phase.phase_name,
    phase.start_date,
    phase.end_date,
    phase.total_working_days,
    phase.change_day_number,
    phase.change_day,
    phase.start_time,
    phase.end_time,
    phase.status
  ]);
};

exports.deactivateActivePhases = async (executor) => {
  await ensurePhaseStatusColumn();
  await getExecutor(executor).execute(
    `UPDATE phases SET status = 'INACTIVE' WHERE status = 'ACTIVE'`
  );
};

exports.insertPhaseTarget = async (target, executor) => {
  const sql = `
    INSERT INTO phase_targets (phase_id, tier, group_target, individual_target)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      group_target = VALUES(group_target),
      individual_target = VALUES(individual_target)
  `;
  await getExecutor(executor).execute(sql, [
    target.phase_id,
    target.tier,
    target.group_target,
    target.individual_target
  ]);
};

exports.upsertIndividualPhaseTarget = async (payload, executor) => {
  const exec = getExecutor(executor);
  const [rows] = await exec.execute(
    `SELECT id FROM individual_phase_target WHERE phase_id = ? ORDER BY id DESC LIMIT 1`,
    [payload.phase_id]
  );

  if (rows.length > 0) {
    await exec.execute(
      `UPDATE individual_phase_target SET target = ? WHERE id = ?`,
      [payload.target, rows[0].id]
    );
    return;
  }

  await exec.execute(
    `INSERT INTO individual_phase_target (phase_id, target) VALUES (?, ?)`,
    [payload.phase_id, payload.target]
  );
};

exports.getPhaseTargets = async (phase_id) => {
  const [rows] = await db.execute(
    `SELECT * FROM phase_targets WHERE phase_id = ?`,
    [phase_id]
  );
  return rows;
};

exports.getCurrentPhase = async () => {
  const [rows] = await db.execute(
    `SELECT *
     FROM phases
     WHERE status IN ('ACTIVE', 'INACTIVE')
       AND TIMESTAMP(start_date, COALESCE(start_time, '00:00:00')) <= NOW()
       AND TIMESTAMP(end_date, COALESCE(end_time, '23:59:59')) > NOW()
     ORDER BY
       start_date DESC,
       start_time DESC,
       CASE WHEN status = 'ACTIVE' THEN 0 ELSE 1 END,
       phase_id DESC
     LIMIT 1`
  );
  return rows[0];
};

exports.getActivePhases = async (executor) => {
  const exec = getExecutor(executor);
  const [rows] = await exec.execute(
    `SELECT *
     FROM phases
     WHERE status = 'ACTIVE'
     ORDER BY start_date DESC, phase_id DESC`
  );
  return rows;
};

exports.getExpiredActivePhases = async (todayDate, executor) => {
  const exec = getExecutor(executor);
  const [rows] = await exec.execute(
    `SELECT *
     FROM phases
     WHERE status = 'ACTIVE'
       AND TIMESTAMP(end_date, COALESCE(end_time, '23:59:59')) <= ?
     ORDER BY end_date ASC, phase_id ASC`,
     [todayDate]
  );
  return rows;
};

exports.getExpiredInactivePhases = async (todayDate, executor) => {
  const exec = getExecutor(executor);
  const [rows] = await exec.execute(
    `SELECT *
     FROM phases
     WHERE status = 'INACTIVE'
       AND TIMESTAMP(end_date, COALESCE(end_time, '23:59:59')) <= ?
     ORDER BY end_date ASC, phase_id ASC`,
    [todayDate]
  );
  return rows;
};

exports.getDueInactivePhases = async (todayDate, executor) => {
  const exec = getExecutor(executor);
  const [rows] = await exec.execute(
    `SELECT *
     FROM phases
     WHERE status = 'INACTIVE'
       AND TIMESTAMP(start_date, COALESCE(start_time, '00:00:00')) <= ?
       AND TIMESTAMP(end_date, COALESCE(end_time, '23:59:59')) > ?
     ORDER BY start_date ASC, start_time ASC, phase_id ASC`,
    [todayDate, todayDate]
  );
  return rows;
};

exports.updatePhaseStatus = async (phase_id, status, executor) => {
  await ensurePhaseStatusColumn();
  const exec = getExecutor(executor);
  await exec.execute(
    `UPDATE phases SET status = ? WHERE phase_id = ?`,
    [status, phase_id]
  );
};

exports.getAllPhases = async () => {
  const [rows] = await db.execute(
    `SELECT *
     FROM phases
     ORDER BY start_date DESC, phase_id DESC`
  );
  return rows;
};

exports.getPhaseById = async (phase_id) => {
  const [rows] = await db.execute(
    `SELECT * FROM phases WHERE phase_id = ?`,
    [phase_id]
  );
  return rows[0];
};

exports.updatePhaseChangeDay = async (phase_id, change_day, change_day_number, executor) => {
  await getExecutor(executor).execute(
    `UPDATE phases
     SET change_day = ?, change_day_number = ?
     WHERE phase_id = ?`,
    [change_day, change_day_number, phase_id]
  );
};

exports.updatePhaseSettings = async (phase_id, payload, executor) => {
  await getExecutor(executor).execute(
    `UPDATE phases
     SET end_date = ?,
         total_working_days = ?,
         change_day_number = ?,
         start_time = ?,
         end_time = ?
     WHERE phase_id = ?`,
    [
      payload.end_date,
      payload.total_working_days,
      payload.change_day_number,
      payload.start_time,
      payload.end_time,
      phase_id
    ]
  );
};

exports.getIndividualPhaseTarget = async (phase_id) => {
  const [rows] = await db.execute(
    `SELECT target
     FROM individual_phase_target
     WHERE phase_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [phase_id]
  );
  return rows[0] || null;
};
