const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const createEvent = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO events
      (
        event_code,
        event_name,
        location,
        registration_link,
        start_date,
        end_date,
        registration_start_date,
        registration_end_date,
        min_members,
        max_members,
        status,
        description,
        created_by
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.event_code,
      payload.event_name,
      payload.location || null,
      payload.registration_link || null,
      payload.start_date || null,
      payload.end_date || null,
      payload.registration_start_date || null,
      payload.registration_end_date || null,
      payload.min_members ?? null,
      payload.max_members ?? null,
      payload.status,
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
       e.location,
        e.registration_link,
       e.start_date,
       e.end_date,
       e.registration_start_date,
       e.registration_end_date,
       e.min_members,
       e.max_members,
       e.status,
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
       e.location,
       e.registration_link,
       e.start_date,
       e.end_date,
       e.registration_start_date,
       e.registration_end_date,
       e.min_members,
       e.max_members,
       e.status,
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
       location = ?,
       registration_link = ?,
       start_date = ?,
       end_date = ?,
       registration_start_date = ?,
       registration_end_date = ?,
       min_members = ?,
       max_members = ?,
       status = ?,
       description = ?
     WHERE event_id = ?`,
    [
      payload.event_code,
      payload.event_name,
      payload.location || null,
      payload.registration_link || null,
      payload.start_date || null,
      payload.end_date || null,
      payload.registration_start_date || null,
      payload.registration_end_date || null,
      payload.min_members ?? null,
      payload.max_members ?? null,
      payload.status,
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
