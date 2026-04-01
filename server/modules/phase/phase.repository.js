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
  const exec = getExecutor(executor);
  await exec.execute(
    `UPDATE phases SET status = ? WHERE phase_id = ?`,
    [status, phase_id]
  );
};

exports.upsertPhaseEndJob = async ({ phase_id, run_at, status = "PENDING" }, executor) => {
  const exec = getExecutor(executor);
  await exec.execute(
    `INSERT INTO phase_end_jobs (
       phase_id,
       run_at,
       status,
       attempts,
       last_error,
       locked_by,
       locked_at,
       completed_at
     )
     VALUES (?, ?, ?, 0, NULL, NULL, NULL, CASE WHEN ? = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE NULL END)
     ON DUPLICATE KEY UPDATE
       run_at = VALUES(run_at),
       status = VALUES(status),
       attempts = CASE WHEN VALUES(status) = 'PENDING' THEN 0 ELSE attempts END,
       last_error = NULL,
       locked_by = NULL,
       locked_at = NULL,
       completed_at = CASE
         WHEN VALUES(status) = 'COMPLETED' THEN CURRENT_TIMESTAMP
         WHEN VALUES(status) = 'PENDING' THEN NULL
         ELSE completed_at
       END`,
    [phase_id, run_at, status, status]
  );
};

exports.getNextPendingPhaseEndJob = async (executor) => {
  const exec = getExecutor(executor);
  const [rows] = await exec.execute(
    `SELECT *
     FROM phase_end_jobs
     WHERE status = 'PENDING'
     ORDER BY run_at ASC, job_id ASC
     LIMIT 1`
  );
  return rows[0] || null;
};

exports.listDuePhaseEndJobs = async (runAt, limit = 25, executor) => {
  const exec = getExecutor(executor);
  const normalizedLimit = Math.max(1, Number(limit) || 25);
  const [rows] = await exec.execute(
    `SELECT *
     FROM phase_end_jobs
     WHERE status = 'PENDING'
       AND run_at <= ?
     ORDER BY run_at ASC, job_id ASC
     LIMIT ${normalizedLimit}`,
    [runAt]
  );
  return rows;
};

exports.claimPhaseEndJob = async (jobId, workerId, executor) => {
  const exec = getExecutor(executor);
  const [result] = await exec.execute(
    `UPDATE phase_end_jobs
     SET status = 'RUNNING',
         attempts = attempts + 1,
         locked_by = ?,
         locked_at = CURRENT_TIMESTAMP,
         last_error = NULL
     WHERE job_id = ?
       AND status = 'PENDING'`,
    [workerId, jobId]
  );
  return Number(result?.affectedRows) === 1;
};

exports.completePhaseEndJob = async (jobId, executor) => {
  const exec = getExecutor(executor);
  await exec.execute(
    `UPDATE phase_end_jobs
     SET status = 'COMPLETED',
         locked_by = NULL,
         locked_at = NULL,
         last_error = NULL,
         completed_at = CURRENT_TIMESTAMP
     WHERE job_id = ?`,
    [jobId]
  );
};

exports.completePhaseEndJobByPhaseId = async (phaseId, executor) => {
  const exec = getExecutor(executor);
  await exec.execute(
    `UPDATE phase_end_jobs
     SET status = 'COMPLETED',
         locked_by = NULL,
         locked_at = NULL,
         last_error = NULL,
         completed_at = CURRENT_TIMESTAMP
     WHERE phase_id = ?`,
    [phaseId]
  );
};

exports.cancelPhaseEndJobByPhaseId = async (phaseId, reason = null, executor) => {
  const exec = getExecutor(executor);
  await exec.execute(
    `UPDATE phase_end_jobs
     SET status = 'CANCELLED',
         locked_by = NULL,
         locked_at = NULL,
         last_error = ?,
         completed_at = NULL
     WHERE phase_id = ?`,
    [reason, phaseId]
  );
};

exports.reschedulePhaseEndJob = async (jobId, runAt, errorMessage = null, executor) => {
  const exec = getExecutor(executor);
  await exec.execute(
    `UPDATE phase_end_jobs
     SET status = 'PENDING',
         run_at = ?,
         locked_by = NULL,
         locked_at = NULL,
         completed_at = NULL,
         last_error = ?
     WHERE job_id = ?`,
    [runAt, errorMessage, jobId]
  );
};

exports.requeueStaleRunningPhaseEndJobs = async (lockedBefore, executor) => {
  const exec = getExecutor(executor);
  const [result] = await exec.execute(
    `UPDATE phase_end_jobs
     SET status = 'PENDING',
         locked_by = NULL,
         locked_at = NULL,
         last_error = COALESCE(last_error, 'Recovered stale phase end job')
     WHERE status = 'RUNNING'
       AND locked_at IS NOT NULL
       AND locked_at <= ?`,
    [lockedBefore]
  );
  return Number(result?.affectedRows) || 0;
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
