const repo = require("./systemConfig.repository");

const KNOWN_KEYS = [
  "min_group_members",
  "max_group_members",
  "incubation_duration_days",
  "allow_student_group_creation",
  "require_leadership_for_activation",
  "enforce_change_day_for_leave"
];

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

module.exports = {
  getOperationalPolicy,
  updateOperationalPolicy,
  getIncubationConfig,
  updateIncubationConfig
};
