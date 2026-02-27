const db = require("../../config/db");
// team_change_tier table is managed via manual SQL migration (DB-first).

const findByPhase = async (phaseId, executor) => {
  const exec = executor || db;
  const [rows] = await exec.query(
    `SELECT
       tct.*,
       g.group_code,
       g.group_name,
       g.tier AS live_group_tier,
       g.status AS group_status,
       p.phase_name,
       pp.phase_name AS previous_phase_name
     FROM team_change_tier tct
     LEFT JOIN Sgroup g ON g.group_id = tct.group_id
     LEFT JOIN phases p ON p.phase_id = tct.phase_id
     LEFT JOIN phases pp ON pp.phase_id = tct.previous_phase_id
     WHERE tct.phase_id = ?
     ORDER BY tct.applied_at DESC, tct.team_change_tier_id DESC`,
    [phaseId]
  );
  return rows;
};

const findByPhaseAndGroupTx = async (conn, phaseId, groupId) => {
  const [rows] = await conn.query(
    `SELECT *
     FROM team_change_tier
     WHERE phase_id=? AND group_id=?
     LIMIT 1
     FOR UPDATE`,
    [phaseId, groupId]
  );
  return rows[0] || null;
};

const upsertAppliedChangeTx = async (conn, payload) => {
  await conn.query(
    `INSERT INTO team_change_tier (
       phase_id,
       group_id,
       previous_phase_id,
       current_tier,
       recommended_tier,
       change_action,
       last_phase_eligible,
       previous_phase_eligible,
       rule_code,
       approved_by_admin_id,
       applied_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       previous_phase_id = VALUES(previous_phase_id),
       current_tier = VALUES(current_tier),
       recommended_tier = VALUES(recommended_tier),
       change_action = VALUES(change_action),
       last_phase_eligible = VALUES(last_phase_eligible),
       previous_phase_eligible = VALUES(previous_phase_eligible),
       rule_code = VALUES(rule_code),
       approved_by_admin_id = VALUES(approved_by_admin_id),
       applied_at = NOW()`,
    [
      payload.phase_id,
      payload.group_id,
      payload.previous_phase_id || null,
      payload.current_tier,
      payload.recommended_tier,
      payload.change_action,
      payload.last_phase_eligible,
      payload.previous_phase_eligible,
      payload.rule_code,
      payload.approved_by_admin_id
    ]
  );
};

module.exports = {
  findByPhase,
  findByPhaseAndGroupTx,
  upsertAppliedChangeTx
};

