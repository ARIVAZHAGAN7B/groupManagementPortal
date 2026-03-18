const db = require("../../config/db");

const DEFAULT_SETTINGS = {
  min_group_members: "9",
  max_group_members: "11",
  incubation_duration_days: "1",
  allow_student_group_creation: "false",
  require_leadership_for_activation: "true",
  enforce_change_day_for_leave: "true"
};

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
        CREATE TABLE IF NOT EXISTS system_settings (
          setting_key VARCHAR(100) PRIMARY KEY,
          setting_value TEXT NOT NULL,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS holidays (
          holiday_id INT PRIMARY KEY AUTO_INCREMENT,
          holiday_date DATE NOT NULL UNIQUE,
          holiday_name VARCHAR(150) NOT NULL,
          description TEXT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      try {
        await db.query(
          `ALTER TABLE memberships ADD COLUMN incubation_end_date DATETIME NULL`
        );
      } catch (error) {
        if (!ignoreDuplicateColumnError(error)) throw error;
      }

      const inserts = Object.entries(DEFAULT_SETTINGS);
      for (const [key, value] of inserts) {
        await db.query(
          `INSERT INTO system_settings (setting_key, setting_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_key = setting_key`,
          [key, value]
        );
      }
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  return ensurePromise;
};

const getAllSettings = async () => {
  await ensureSchema();
  const [rows] = await db.query(
    `SELECT setting_key, setting_value, updated_at
     FROM system_settings`
  );
  return rows;
};

const getSettingsByKeys = async (keys = []) => {
  await ensureSchema();
  if (!Array.isArray(keys) || keys.length === 0) return [];

  const placeholders = keys.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT setting_key, setting_value, updated_at
     FROM system_settings
     WHERE setting_key IN (${placeholders})`,
    keys
  );
  return rows;
};

const upsertSettings = async (entries = [], executor) => {
  await ensureSchema();
  if (!Array.isArray(entries) || entries.length === 0) return;

  const exec = executor || db;
  for (const entry of entries) {
    await exec.query(
      `INSERT INTO system_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         updated_at = CURRENT_TIMESTAMP`,
      [entry.setting_key, String(entry.setting_value)]
    );
  }
};

const getAllHolidays = async () => {
  await ensureSchema();
  const [rows] = await db.query(
    `SELECT holiday_id, DATE_FORMAT(holiday_date, '%Y-%m-%d') AS holiday_date, holiday_name, description, created_at, updated_at
     FROM holidays
     ORDER BY holiday_date ASC, holiday_name ASC`
  );
  return rows;
};

const getHolidayById = async (holidayId) => {
  await ensureSchema();
  const [rows] = await db.query(
    `SELECT holiday_id, DATE_FORMAT(holiday_date, '%Y-%m-%d') AS holiday_date, holiday_name, description, created_at, updated_at
     FROM holidays
     WHERE holiday_id = ?
     LIMIT 1`,
    [holidayId]
  );
  return rows[0] || null;
};

const getHolidayByDate = async (holidayDate) => {
  await ensureSchema();
  const [rows] = await db.query(
    `SELECT holiday_id, DATE_FORMAT(holiday_date, '%Y-%m-%d') AS holiday_date, holiday_name, description, created_at, updated_at
     FROM holidays
     WHERE holiday_date = ?
     LIMIT 1`,
    [holidayDate]
  );
  return rows[0] || null;
};

const createHoliday = async ({ holiday_date, holiday_name, description }) => {
  await ensureSchema();
  const [result] = await db.query(
    `INSERT INTO holidays (holiday_date, holiday_name, description)
     VALUES (?, ?, ?)`,
    [holiday_date, holiday_name, description || null]
  );
  return getHolidayById(result.insertId);
};

const updateHoliday = async (holidayId, { holiday_date, holiday_name, description }) => {
  await ensureSchema();
  await db.query(
    `UPDATE holidays
     SET holiday_date = ?, holiday_name = ?, description = ?
     WHERE holiday_id = ?`,
    [holiday_date, holiday_name, description || null, holidayId]
  );
  return getHolidayById(holidayId);
};

const deleteHoliday = async (holidayId) => {
  await ensureSchema();
  const [result] = await db.query(`DELETE FROM holidays WHERE holiday_id = ?`, [holidayId]);
  return result.affectedRows > 0;
};

module.exports = {
  DEFAULT_SETTINGS,
  ensureSchema,
  getAllSettings,
  getSettingsByKeys,
  upsertSettings,
  getAllHolidays,
  getHolidayById,
  getHolidayByDate,
  createHoliday,
  updateHoliday,
  deleteHoliday
};
