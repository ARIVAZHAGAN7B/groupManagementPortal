const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const TEAM_TARGET_SELECT = `
  SELECT
    t.team_id,
    t.event_id,
    t.team_code,
    t.team_name,
    t.team_type,
    t.status AS team_status,
    t.description AS team_description,
    e.event_code,
    e.event_name,
    e.status AS event_status,
    COALESCE(mc.active_member_count, 0) AS active_member_count,
    tt.team_target_id,
    tt.target_member_count,
    tt.notes AS target_notes,
    tt.updated_by AS target_updated_by,
    tt.created_at AS target_created_at,
    tt.updated_at AS target_updated_at
  FROM teams t
  LEFT JOIN events e
    ON e.event_id = t.event_id
  LEFT JOIN (
    SELECT team_id, COUNT(*) AS active_member_count
    FROM team_membership
    WHERE status = 'ACTIVE'
    GROUP BY team_id
  ) mc
    ON mc.team_id = t.team_id
  LEFT JOIN team_target tt
    ON tt.team_id = t.team_id
`;

const getAllTeamTargets = async (filters = {}, executor) => {
  const clauses = ["1=1"];
  const values = [];

  if (filters.team_id) {
    clauses.push("t.team_id = ?");
    values.push(Number(filters.team_id));
  }

  if (filters.event_id !== undefined) {
    if (filters.event_id === null) {
      clauses.push("t.event_id IS NULL");
    } else {
      clauses.push("t.event_id = ?");
      values.push(Number(filters.event_id));
    }
  }

  if (filters.team_type) {
    clauses.push("t.team_type = ?");
    values.push(String(filters.team_type).toUpperCase());
  }

  if (filters.exclude_team_type) {
    clauses.push("t.team_type <> ?");
    values.push(String(filters.exclude_team_type).toUpperCase());
  }

  if (filters.team_status) {
    clauses.push("t.status = ?");
    values.push(String(filters.team_status).toUpperCase());
  }

  const [rows] = await getExecutor(executor).query(
    `${TEAM_TARGET_SELECT}
     WHERE ${clauses.join(" AND ")}
     ORDER BY
       CASE t.status
         WHEN 'ACTIVE' THEN 1
         WHEN 'FROZEN' THEN 2
         WHEN 'INACTIVE' THEN 3
         WHEN 'ARCHIVED' THEN 4
         ELSE 5
       END,
       t.team_name ASC,
       t.team_id ASC`,
    values
  );

  return rows;
};

const getTeamTargetByTeamId = async (teamId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${TEAM_TARGET_SELECT}
     WHERE t.team_id = ?
     LIMIT 1`,
    [Number(teamId)]
  );

  return rows[0] || null;
};

const upsertTeamTarget = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO team_target (team_id, target_member_count, notes, updated_by)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       target_member_count = VALUES(target_member_count),
       notes = VALUES(notes),
       updated_by = VALUES(updated_by),
       updated_at = NOW()`,
    [
      Number(payload.team_id),
      Number(payload.target_member_count),
      payload.notes || null,
      payload.updated_by || null
    ]
  );

  return result;
};

module.exports = {
  getAllTeamTargets,
  getTeamTargetByTeamId,
  upsertTeamTarget
};
