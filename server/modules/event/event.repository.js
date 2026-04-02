const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

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
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
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
      payload.applied_count ?? null,
      payload.apply_by_student ? 1 : 0,
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
       e.applied_count,
       e.apply_by_student,
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
       COALESCE(tc.team_count, 0) AS team_count
     FROM events e
     LEFT JOIN (
       SELECT event_id, COUNT(*) AS team_count
       FROM teams
       WHERE event_id IS NOT NULL
         AND UPPER(team_type) = 'EVENT'
       GROUP BY event_id
     ) tc ON tc.event_id = e.event_id
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
       e.applied_count,
       e.apply_by_student,
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
       COALESCE(tc.team_count, 0) AS team_count
     FROM events e
     LEFT JOIN (
       SELECT event_id, COUNT(*) AS team_count
       FROM teams
       WHERE event_id IS NOT NULL
         AND UPPER(team_type) = 'EVENT'
       GROUP BY event_id
     ) tc ON tc.event_id = e.event_id
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
       applied_count = ?,
       apply_by_student = ?,
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
      payload.applied_count ?? null,
      payload.apply_by_student ? 1 : 0,
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

const setEventStatus = async (eventId, status, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE events SET status = ? WHERE event_id = ?`,
    [status, eventId]
  );
  return result;
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  getEventByCode,
  updateEvent,
  setEventStatus
};
