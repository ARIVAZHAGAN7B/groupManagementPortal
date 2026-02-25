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

module.exports = {
  DEFAULT_SETTINGS,
  ensureSchema,
  getAllSettings,
  getSettingsByKeys,
  upsertSettings
};
