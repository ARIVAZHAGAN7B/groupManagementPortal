const db = require("../../config/db");

const getExecutor = (executor) => executor || db;
let ensurePromise = null;

const ignoreDuplicateColumnError = (error) => {
  if (!error) return false;
  return (
    error.code === "ER_DUP_FIELDNAME" ||
    error.errno === 1060 ||
    /Duplicate column name/i.test(String(error.message || ""))
  );
};

const ensureSchema = async () => {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS events (
          event_id INT NOT NULL AUTO_INCREMENT,
          event_code VARCHAR(50) NOT NULL,
          event_name VARCHAR(150) NOT NULL,
          location VARCHAR(255) NULL,
          registration_link VARCHAR(500) NULL,
          start_date DATE NULL,
          end_date DATE NULL,
          registration_start_date DATE NULL,
          registration_end_date DATE NULL,
          min_members INT NULL,
          max_members INT NULL,
          status ENUM('ACTIVE','CLOSED','INACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
          description TEXT NULL,
          created_by VARCHAR(36) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (event_id),
          UNIQUE KEY uq_events_code (event_code),
          KEY idx_events_status (status),
          KEY idx_events_dates (start_date, end_date),
          KEY idx_events_registration_dates (registration_start_date, registration_end_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      const alterStatements = [
        `ALTER TABLE events ADD COLUMN location VARCHAR(255) NULL AFTER event_name`,
        `ALTER TABLE events ADD COLUMN registration_link VARCHAR(500) NULL AFTER location`,
        `ALTER TABLE events ADD COLUMN registration_start_date DATE NULL AFTER end_date`,
        `ALTER TABLE events ADD COLUMN registration_end_date DATE NULL AFTER registration_start_date`,
        `ALTER TABLE events ADD COLUMN min_members INT NULL AFTER registration_end_date`,
        `ALTER TABLE events ADD COLUMN max_members INT NULL AFTER min_members`
      ];

      for (const statement of alterStatements) {
        try {
          await db.query(statement);
        } catch (error) {
          if (!ignoreDuplicateColumnError(error)) throw error;
        }
      }
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  return ensurePromise;
};

const createEvent = async (payload, executor) => {
  await ensureSchema();
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
  await ensureSchema();
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
  await ensureSchema();
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
  await ensureSchema();
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
  await ensureSchema();
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
  await ensureSchema();
  const [result] = await getExecutor(executor).query(
    `UPDATE events SET status = ? WHERE event_id = ?`,
    [status, eventId]
  );
  return result;
};

module.exports = {
  ensureSchema,
  createEvent,
  getAllEvents,
  getEventById,
  getEventByCode,
  updateEvent,
  setEventStatus
};
