const repo = require("./systemConfig.repository");

const KNOWN_KEYS = [
  "min_group_members",
  "max_group_members",
  "incubation_duration_days",
  "allow_student_group_creation",
  "require_leadership_for_activation",
  "enforce_change_day_for_leave"
];

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const toSettingsMap = (rows = []) => {
  const map = new Map();
  for (const row of rows) {
    map.set(String(row.setting_key), row.setting_value);
  }
  return map;
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return fallback;
};

const parsePositiveInt = (value, fieldName, min = 0, max = 3650) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return n;
};

const parseDateOnly = (value, fieldName = "holiday_date") => {
  const normalized = String(value || "").trim();
  if (!DATE_ONLY_RE.test(normalized)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format`);
  }
  return normalized;
};

const parseRequiredText = (value, fieldName, maxLength = 150) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer`);
  }
  return normalized;
};

const parseOptionalText = (value, fieldName, maxLength = 500) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer`);
  }
  return normalized;
};

const normalizeHolidayDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const normalized = String(value).trim();
  const matched = normalized.match(/\d{4}-\d{2}-\d{2}/);
  return matched ? matched[0] : normalized;
};

const normalizeHolidayRow = (row) => ({
  ...row,
  holiday_date: normalizeHolidayDate(row?.holiday_date)
});

const isDuplicateHolidayError = (error) =>
  error?.code === "ER_DUP_ENTRY" || /duplicate/i.test(String(error?.message || ""));

const normalizePolicyPayload = (payload = {}, current) => {
  const minGroupMembers = payload.min_group_members ?? current.min_group_members;
  const maxGroupMembers = payload.max_group_members ?? current.max_group_members;
  const incubationDurationDays =
    payload.incubation_duration_days ?? current.incubation_duration_days;

  const normalized = {
    min_group_members: parsePositiveInt(minGroupMembers, "min_group_members", 1, 200),
    max_group_members: parsePositiveInt(maxGroupMembers, "max_group_members", 1, 200),
    incubation_duration_days: parsePositiveInt(
      incubationDurationDays,
      "incubation_duration_days",
      0,
      30
    ),
    allow_student_group_creation: parseBoolean(
      payload.allow_student_group_creation ?? current.allow_student_group_creation
    ),
    require_leadership_for_activation: parseBoolean(
      payload.require_leadership_for_activation ?? current.require_leadership_for_activation,
      true
    ),
    enforce_change_day_for_leave: parseBoolean(
      payload.enforce_change_day_for_leave ?? current.enforce_change_day_for_leave,
      true
    )
  };

  if (normalized.min_group_members > normalized.max_group_members) {
    throw new Error("min_group_members cannot be greater than max_group_members");
  }

  if (normalized.max_group_members < 4 && normalized.require_leadership_for_activation) {
    throw new Error("max_group_members must be at least 4 when leadership is required");
  }

  return normalized;
};

const getOperationalPolicy = async () => {
  const rows = await repo.getSettingsByKeys(KNOWN_KEYS);
  const map = toSettingsMap(rows);

  const settings = {
    min_group_members: Number(map.get("min_group_members") ?? 9),
    max_group_members: Number(map.get("max_group_members") ?? 11),
    incubation_duration_days: Number(map.get("incubation_duration_days") ?? 1),
    allow_student_group_creation: parseBoolean(map.get("allow_student_group_creation"), false),
    require_leadership_for_activation: parseBoolean(
      map.get("require_leadership_for_activation"),
      true
    ),
    enforce_change_day_for_leave: parseBoolean(
      map.get("enforce_change_day_for_leave"),
      true
    )
  };

  if (!Number.isInteger(settings.min_group_members) || settings.min_group_members < 1) {
    settings.min_group_members = 9;
  }
  if (!Number.isInteger(settings.max_group_members) || settings.max_group_members < 1) {
    settings.max_group_members = 11;
  }
  if (settings.min_group_members > settings.max_group_members) {
    settings.min_group_members = 9;
    settings.max_group_members = 11;
  }
  if (
    !Number.isInteger(settings.incubation_duration_days) ||
    settings.incubation_duration_days < 0
  ) {
    settings.incubation_duration_days = 1;
  }

  return settings;
};

const updateOperationalPolicy = async (payload = {}) => {
  const current = await getOperationalPolicy();
  const normalized = normalizePolicyPayload(payload, current);

  await repo.upsertSettings(
    Object.entries(normalized).map(([setting_key, setting_value]) => ({
      setting_key,
      setting_value
    }))
  );

  return getOperationalPolicy();
};

const getIncubationConfig = async () => {
  const policy = await getOperationalPolicy();
  return {
    incubation_duration_days: policy.incubation_duration_days,
    enforce_change_day_for_leave: policy.enforce_change_day_for_leave
  };
};

const updateIncubationConfig = async (payload = {}) => {
  const current = await getOperationalPolicy();
  const next = {
    incubation_duration_days:
      payload.incubation_duration_days ?? current.incubation_duration_days,
    enforce_change_day_for_leave:
      payload.enforce_change_day_for_leave ?? current.enforce_change_day_for_leave
  };

  const normalized = {
    incubation_duration_days: parsePositiveInt(
      next.incubation_duration_days,
      "incubation_duration_days",
      0,
      30
    ),
    enforce_change_day_for_leave: parseBoolean(
      next.enforce_change_day_for_leave,
      true
    )
  };

  await repo.upsertSettings(
    Object.entries(normalized).map(([setting_key, setting_value]) => ({
      setting_key,
      setting_value
    }))
  );

  return getIncubationConfig();
};

const listHolidays = async () => {
  const rows = await repo.getAllHolidays();
  return rows.map(normalizeHolidayRow);
};

const getHolidayById = async (holidayId) => {
  const parsedHolidayId = parsePositiveInt(holidayId, "holiday_id", 1, 1000000000);
  const holiday = await repo.getHolidayById(parsedHolidayId);
  if (!holiday) {
    throw new Error("Holiday not found");
  }

  return normalizeHolidayRow(holiday);
};

const createHoliday = async (payload = {}) => {
  const holiday = {
    holiday_date: parseDateOnly(payload.holiday_date),
    holiday_name: parseRequiredText(payload.holiday_name, "holiday_name", 150),
    description: parseOptionalText(payload.description, "description", 500)
  };

  try {
    const created = await repo.createHoliday(holiday);
    return normalizeHolidayRow(created);
  } catch (error) {
    if (isDuplicateHolidayError(error)) {
      throw new Error(`A holiday already exists for ${holiday.holiday_date}`);
    }
    throw error;
  }
};

const updateHoliday = async (holidayId, payload = {}) => {
  const parsedHolidayId = parsePositiveInt(holidayId, "holiday_id", 1, 1000000000);
  const existing = await repo.getHolidayById(parsedHolidayId);
  if (!existing) {
    throw new Error("Holiday not found");
  }

  const holiday = {
    holiday_date: parseDateOnly(payload.holiday_date ?? existing.holiday_date),
    holiday_name: parseRequiredText(
      payload.holiday_name ?? existing.holiday_name,
      "holiday_name",
      150
    ),
    description: parseOptionalText(
      payload.description ?? existing.description,
      "description",
      500
    )
  };

  try {
    const updated = await repo.updateHoliday(parsedHolidayId, holiday);
    return normalizeHolidayRow(updated);
  } catch (error) {
    if (isDuplicateHolidayError(error)) {
      throw new Error(`A holiday already exists for ${holiday.holiday_date}`);
    }
    throw error;
  }
};

const deleteHoliday = async (holidayId) => {
  const parsedHolidayId = parsePositiveInt(holidayId, "holiday_id", 1, 1000000000);
  const existing = await repo.getHolidayById(parsedHolidayId);
  if (!existing) {
    throw new Error("Holiday not found");
  }

  await repo.deleteHoliday(parsedHolidayId);
  return normalizeHolidayRow(existing);
};

module.exports = {
  getOperationalPolicy,
  updateOperationalPolicy,
  getIncubationConfig,
  updateIncubationConfig,
  listHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday
};
