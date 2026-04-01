const db = require("../../config/db");

const DEFAULT_SETTINGS = {
  min_group_members: "9",
  max_group_members: "11",
  incubation_duration_days: "1",
  allow_student_group_creation: "false",
  require_leadership_for_activation: "true",
  enforce_change_day_for_leave: "true"
};

const getAllSettings = async () => {
  const [rows] = await db.query(
    `SELECT setting_key, setting_value, updated_at
     FROM system_settings`
  );
  return rows;
};

const getSettingsByKeys = async (keys = []) => {
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
  const [rows] = await db.query(
    `SELECT holiday_id, DATE_FORMAT(holiday_date, '%Y-%m-%d') AS holiday_date, holiday_name, description, created_at, updated_at
     FROM holidays
     ORDER BY holiday_date ASC, holiday_name ASC`
  );
  return rows;
};

const getHolidayById = async (holidayId) => {
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
  const [result] = await db.query(
    `INSERT INTO holidays (holiday_date, holiday_name, description)
     VALUES (?, ?, ?)`,
    [holiday_date, holiday_name, description || null]
  );
  return getHolidayById(result.insertId);
};

const updateHoliday = async (holidayId, { holiday_date, holiday_name, description }) => {
  await db.query(
    `UPDATE holidays
     SET holiday_date = ?, holiday_name = ?, description = ?
     WHERE holiday_id = ?`,
    [holiday_date, holiday_name, description || null, holidayId]
  );
  return getHolidayById(holidayId);
};

const deleteHoliday = async (holidayId) => {
  const [result] = await db.query(`DELETE FROM holidays WHERE holiday_id = ?`, [holidayId]);
  return result.affectedRows > 0;
};

module.exports = {
  DEFAULT_SETTINGS,
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
