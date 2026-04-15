const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const normalizeIdList = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );

const ACTIVE_MEMBER_COUNT_SUBQUERY = `
  SELECT team_id, COUNT(*) AS active_member_count
  FROM team_membership
  WHERE status = 'ACTIVE'
  GROUP BY team_id
`;

const EVENT_PARTICIPATION_METRICS_JOIN = `
  LEFT JOIN (
    SELECT
      t.event_id,
      COUNT(*) AS total_team_count,
      SUM(CASE WHEN UPPER(t.status) = 'ACTIVE' THEN 1 ELSE 0 END) AS active_team_count,
      SUM(
        CASE
          WHEN UPPER(t.status) = 'ACTIVE'
           AND COALESCE(mc.active_member_count, 0) >=
               CASE
                 WHEN e2.min_members IS NOT NULL AND e2.min_members > 0 THEN e2.min_members
                 ELSE 1
               END
          THEN 1
          ELSE 0
        END
      ) AS valid_team_count
    FROM teams t
    INNER JOIN events e2
      ON e2.event_id = t.event_id
    LEFT JOIN (
      ${ACTIVE_MEMBER_COUNT_SUBQUERY}
    ) mc
      ON mc.team_id = t.team_id
    WHERE t.event_id IS NOT NULL
      AND UPPER(t.team_type) = 'EVENT'
    GROUP BY t.event_id
  ) pm
    ON pm.event_id = e.event_id
`;

const createEvent = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO events
      (
        event_code,
        event_name,
        event_organizer,
        event_category,
        location,
        event_level,
        state,
        country,
        within_bit,
        related_to_special_lab,
        department,
        competition_name,
        total_level_of_competition,
        registration_link,
        selected_resources,
        maximum_count,
        applied_count,
        apply_by_student,
        registration_mode,
        start_date,
        end_date,
        registration_start_date,
        registration_end_date,
        min_members,
        max_members,
        status,
        eligible_for_rewards,
        winner_rewards,
        reward_allocation,
        description,
        created_by
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      payload.event_code,
      payload.event_name,
      payload.event_organizer || null,
      payload.event_category || null,
      payload.location || null,
      payload.event_level || null,
      payload.state || null,
      payload.country || null,
      payload.within_bit ? 1 : 0,
      payload.related_to_special_lab ? 1 : 0,
      payload.department || null,
      payload.competition_name || null,
      payload.total_level_of_competition || null,
      payload.registration_link || null,
      payload.selected_resources || null,
      payload.maximum_count ?? null,
      0,
      payload.apply_by_student ? 1 : 0,
      payload.registration_mode || "TEAM",
      payload.start_date || null,
      payload.end_date || null,
      payload.registration_start_date || null,
      payload.registration_end_date || null,
      payload.min_members ?? null,
      payload.max_members ?? null,
      payload.status,
      payload.eligible_for_rewards ? 1 : 0,
      payload.winner_rewards || null,
      payload.reward_allocation || null,
      payload.description || null,
      payload.created_by || null
    ]
  );
  return result;
};

const createEventRound = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO event_rounds
      (
        event_id,
        round_order,
        round_name,
        round_date,
        round_end_date,
        start_time,
        end_time,
        location,
        description,
        round_mode,
        status
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.event_id,
      payload.round_order,
      payload.round_name,
      payload.round_date || null,
      payload.round_end_date || null,
      payload.start_time || null,
      payload.end_time || null,
      payload.location || null,
      payload.description || null,
      payload.round_mode || "ONLINE",
      payload.status || "SCHEDULED"
    ]
  );
  return result;
};

const getAllEvents = async (executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       e.event_id,
       e.event_code,
       e.event_name,
       e.event_organizer,
       e.event_category,
       e.location,
       e.event_level,
       e.state,
       e.country,
       e.within_bit,
       e.related_to_special_lab,
       e.department,
       e.competition_name,
       e.total_level_of_competition,
       e.registration_link,
       e.selected_resources,
       e.maximum_count,
       COALESCE(pm.valid_team_count, 0) AS applied_count,
       e.apply_by_student,
       e.registration_mode,
       e.start_date,
       e.end_date,
       e.registration_start_date,
       e.registration_end_date,
       e.min_members,
       e.max_members,
       e.status,
       e.eligible_for_rewards,
       e.winner_rewards,
       e.reward_allocation,
       e.description,
       e.created_by,
       e.created_at,
       e.updated_at,
       COALESCE(pm.total_team_count, 0) AS total_team_count,
       COALESCE(pm.active_team_count, 0) AS active_team_count,
       COALESCE(pm.valid_team_count, 0) AS valid_team_count,
       GREATEST(COALESCE(pm.active_team_count, 0) - COALESCE(pm.valid_team_count, 0), 0) AS forming_team_count,
       COALESCE(pm.active_team_count, 0) AS team_count
     FROM events e
     ${EVENT_PARTICIPATION_METRICS_JOIN}
     ORDER BY
       CASE e.status
         WHEN 'ACTIVE' THEN 1
         WHEN 'CLOSED' THEN 2
         WHEN 'INACTIVE' THEN 3
         WHEN 'ARCHIVED' THEN 4
         ELSE 5
       END,
       e.start_date DESC,
       e.event_id DESC`
  );
  return rows;
};

const getRoundsByEventId = async (eventId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       round_id,
       event_id,
       round_order,
       round_name,
       round_date,
       round_end_date,
       start_time,
       end_time,
       location,
       description,
       round_mode,
       status,
       created_at,
       updated_at
     FROM event_rounds
     WHERE event_id = ?
     ORDER BY round_order ASC, round_id ASC`,
    [eventId]
  );
  return rows;
};

const getAllowedHubsByEventId = async (eventId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       eha.event_id,
       h.hub_id,
       h.hub_code AS team_code,
       h.hub_name AS team_name,
       'HUB' AS team_type,
       h.hub_priority,
       h.status
     FROM event_hub_access eha
     INNER JOIN hubs h ON h.hub_id = eha.hub_id
     WHERE eha.event_id = ?
     ORDER BY
       CASE h.hub_priority
         WHEN 'PROMINENT' THEN 1
         WHEN 'MEDIUM' THEN 2
         WHEN 'LOW' THEN 3
         ELSE 4
       END,
       h.hub_name ASC,
       h.hub_id ASC`,
    [eventId]
  );
  return rows;
};

const getAllowedHubsByEventIds = async (eventIds = [], executor) => {
  const normalizedIds = normalizeIdList(eventIds);
  if (normalizedIds.length === 0) {
    return [];
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const [rows] = await getExecutor(executor).query(
    `SELECT
       eha.event_id,
       h.hub_id,
       h.hub_code AS team_code,
       h.hub_name AS team_name,
       'HUB' AS team_type,
       h.hub_priority,
       h.status
     FROM event_hub_access eha
     INNER JOIN hubs h ON h.hub_id = eha.hub_id
     WHERE eha.event_id IN (${placeholders})
     ORDER BY
       eha.event_id ASC,
       CASE h.hub_priority
         WHEN 'PROMINENT' THEN 1
         WHEN 'MEDIUM' THEN 2
         WHEN 'LOW' THEN 3
         ELSE 4
       END,
       h.hub_name ASC,
       h.hub_id ASC`,
    normalizedIds
  );
  return rows;
};

const getAllowedHubIdsByEventId = async (eventId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT hub_id
     FROM event_hub_access
     WHERE event_id = ?
     ORDER BY hub_id ASC`,
    [eventId]
  );
  return rows.map((row) => Number(row.hub_id)).filter((value) => Number.isInteger(value));
};

const replaceAllowedHubs = async (eventId, hubIds = [], executor) => {
  const normalizedHubIds = normalizeIdList(hubIds);

  await getExecutor(executor).query(
    `DELETE FROM event_hub_access WHERE event_id = ?`,
    [eventId]
  );

  if (normalizedHubIds.length === 0) {
    return;
  }

  const values = [];
  const placeholders = normalizedHubIds
    .map((hubId) => {
      values.push(eventId, hubId);
      return "(?, ?)";
    })
    .join(", ");

  await getExecutor(executor).query(
    `INSERT INTO event_hub_access (event_id, hub_id)
     VALUES ${placeholders}`,
    values
  );
};

const getEventById = async (eventId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       e.event_id,
       e.event_code,
       e.event_name,
       e.event_organizer,
       e.event_category,
       e.location,
       e.event_level,
       e.state,
       e.country,
       e.within_bit,
       e.related_to_special_lab,
       e.department,
       e.competition_name,
       e.total_level_of_competition,
       e.registration_link,
       e.selected_resources,
       e.maximum_count,
       COALESCE(pm.valid_team_count, 0) AS applied_count,
       e.apply_by_student,
       e.registration_mode,
       e.start_date,
       e.end_date,
       e.registration_start_date,
       e.registration_end_date,
       e.min_members,
       e.max_members,
       e.status,
       e.eligible_for_rewards,
       e.winner_rewards,
       e.reward_allocation,
       e.description,
       e.created_by,
       e.created_at,
       e.updated_at,
       COALESCE(pm.total_team_count, 0) AS total_team_count,
       COALESCE(pm.active_team_count, 0) AS active_team_count,
       COALESCE(pm.valid_team_count, 0) AS valid_team_count,
       GREATEST(COALESCE(pm.active_team_count, 0) - COALESCE(pm.valid_team_count, 0), 0) AS forming_team_count,
       COALESCE(pm.active_team_count, 0) AS team_count
     FROM events e
     ${EVENT_PARTICIPATION_METRICS_JOIN}
     WHERE e.event_id = ?
     LIMIT 1`,
    [eventId]
  );
  return rows[0] || null;
};

const getEventByCode = async (eventCode, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT event_id, event_code, event_name, status
     FROM events
     WHERE event_code = ?
     LIMIT 1`,
    [eventCode]
  );
  return rows[0] || null;
};

const updateEvent = async (eventId, payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE events
     SET
       event_code = ?,
       event_name = ?,
       event_organizer = ?,
       event_category = ?,
       location = ?,
       event_level = ?,
       state = ?,
       country = ?,
       within_bit = ?,
       related_to_special_lab = ?,
       department = ?,
       competition_name = ?,
       total_level_of_competition = ?,
       registration_link = ?,
       selected_resources = ?,
       maximum_count = ?,
       apply_by_student = ?,
       registration_mode = ?,
       start_date = ?,
       end_date = ?,
       registration_start_date = ?,
       registration_end_date = ?,
       min_members = ?,
       max_members = ?,
       status = ?,
       eligible_for_rewards = ?,
       winner_rewards = ?,
       reward_allocation = ?,
       description = ?
     WHERE event_id = ?`,
    [
      payload.event_code,
      payload.event_name,
      payload.event_organizer || null,
      payload.event_category || null,
      payload.location || null,
      payload.event_level || null,
      payload.state || null,
      payload.country || null,
      payload.within_bit ? 1 : 0,
      payload.related_to_special_lab ? 1 : 0,
      payload.department || null,
      payload.competition_name || null,
      payload.total_level_of_competition || null,
      payload.registration_link || null,
      payload.selected_resources || null,
      payload.maximum_count ?? null,
      payload.apply_by_student ? 1 : 0,
      payload.registration_mode || "TEAM",
      payload.start_date || null,
      payload.end_date || null,
      payload.registration_start_date || null,
      payload.registration_end_date || null,
      payload.min_members ?? null,
      payload.max_members ?? null,
      payload.status,
      payload.eligible_for_rewards ? 1 : 0,
      payload.winner_rewards || null,
      payload.reward_allocation || null,
      payload.description || null,
      eventId
    ]
  );
  return result;
};

const deleteRoundsByEventId = async (eventId, executor) => {
  const [result] = await getExecutor(executor).query(
    `DELETE FROM event_rounds WHERE event_id = ?`,
    [eventId]
  );
  return result;
};

const setEventStatus = async (eventId, status, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE events SET status = ? WHERE event_id = ?`,
    [status, eventId]
  );
  return result;
};

const updateEventAppliedCount = async (eventId, appliedCount, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE events
     SET applied_count = ?
     WHERE event_id = ?`,
    [appliedCount, eventId]
  );
  return result;
};

const getEventParticipationCounts = async (eventId, requiredMinMembers = 1, executor) => {
  const normalizedRequiredMinMembers =
    Number.isInteger(Number(requiredMinMembers)) && Number(requiredMinMembers) > 0
      ? Number(requiredMinMembers)
      : 1;

  const [[row]] = await getExecutor(executor).query(
    `SELECT
       COUNT(*) AS total_team_count,
       SUM(CASE WHEN UPPER(t.status) = 'ACTIVE' THEN 1 ELSE 0 END) AS active_team_count,
       SUM(
         CASE
           WHEN UPPER(t.status) = 'ACTIVE'
            AND COALESCE(mc.active_member_count, 0) >= ?
           THEN 1
           ELSE 0
         END
       ) AS valid_team_count
     FROM teams t
     LEFT JOIN (
       ${ACTIVE_MEMBER_COUNT_SUBQUERY}
     ) mc
       ON mc.team_id = t.team_id
     WHERE t.event_id = ?
       AND UPPER(t.team_type) = 'EVENT'`,
    [normalizedRequiredMinMembers, eventId]
  );

  return {
    total_team_count: Number(row?.total_team_count) || 0,
    active_team_count: Number(row?.active_team_count) || 0,
    valid_team_count: Number(row?.valid_team_count) || 0
  };
};

const lockEventById = async (eventId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       event_id,
       event_code,
       event_name,
       maximum_count,
       min_members,
       max_members,
       status,
       registration_mode,
       registration_start_date,
       registration_end_date,
       apply_by_student
     FROM events
     WHERE event_id = ?
     LIMIT 1
     FOR UPDATE`,
    [eventId]
  );
  return rows[0] || null;
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  getEventByCode,
  createEventRound,
  getRoundsByEventId,
  getAllowedHubsByEventId,
  getAllowedHubsByEventIds,
  getAllowedHubIdsByEventId,
  replaceAllowedHubs,
  updateEvent,
  deleteRoundsByEventId,
  setEventStatus,
  updateEventAppliedCount,
  getEventParticipationCounts,
  lockEventById
};
