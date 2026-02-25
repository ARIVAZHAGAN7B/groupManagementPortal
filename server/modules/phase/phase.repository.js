const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

exports.insertPhase = async (phase, executor) => {
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
    `SELECT * FROM phases WHERE status='ACTIVE' ORDER BY start_date DESC LIMIT 1`
  );
  return rows[0];
};

exports.getExpiredActivePhases = async (todayDate, executor) => {
  const exec = getExecutor(executor);
  const [rows] = await exec.execute(
    `SELECT *
     FROM phases
     WHERE status = 'ACTIVE'
       AND TIMESTAMP(end_date, COALESCE(end_time, '23:59:59')) < ?
     ORDER BY end_date ASC, phase_id ASC`,
     [todayDate]
  );
  return rows;
};

exports.updatePhaseStatus = async (phase_id, status, executor) => {
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
