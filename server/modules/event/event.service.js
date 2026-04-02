const repo = require("./event.repository");

const EVENT_STATUSES = ["ACTIVE", "CLOSED", "INACTIVE", "ARCHIVED"];

const normalizeText = (value) => String(value || "").trim();
const normalizeCode = (value) => normalizeText(value).toUpperCase();
const normalizeUrl = (value, fieldName) => {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    return parsed.toString();
  } catch (_error) {
    throw new Error(`${fieldName} must be a valid URL`);
  }
};

const normalizeStatus = (value) => {
  const normalized = normalizeText(value).toUpperCase() || "ACTIVE";
  if (!EVENT_STATUSES.includes(normalized)) {
    throw new Error(`status must be one of: ${EVENT_STATUSES.join(", ")}`);
  }
  return normalized;
};

const normalizeDate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date value");
  return d.toISOString().split("T")[0];
};

const normalizeOptionalPositiveInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return parsed;
};

const normalizeOptionalNonNegativeInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
  return parsed;
};

const normalizeOptionalBoolean = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  const normalized = normalizeText(value).toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;

  throw new Error(`${fieldName} must be true or false`);
};

const normalizeNumberOrNull = (value) =>
  value === null || value === undefined || value === "" ? null : Number(value);

const normalizeBooleanOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  return Number(value) === 1;
};

const calculateDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((end.getTime() - start.getTime()) / msPerDay);
  if (diff < 0) return null;

  return diff + 1;
};

const calculateBalanceCount = (maximumCount, appliedCount) => {
  const maxValue = normalizeNumberOrNull(maximumCount);
  const appliedValue = normalizeNumberOrNull(appliedCount);

  if (maxValue === null || Number.isNaN(maxValue)) return null;
  if (appliedValue === null || Number.isNaN(appliedValue)) return maxValue;

  return Math.max(0, maxValue - appliedValue);
};

const normalizePayload = (payload = {}) => {
  const event_code = normalizeCode(payload.event_code);
  const event_name = normalizeText(payload.event_name);
  const event_organizer = normalizeText(payload.event_organizer) || null;
  const event_category = normalizeText(payload.event_category) || null;
  const location = normalizeText(payload.location) || null;
  const event_level = normalizeText(payload.event_level) || null;
  const state = normalizeText(payload.state) || null;
  const country = normalizeText(payload.country) || null;
  const within_bit = normalizeOptionalBoolean(payload.within_bit, "within_bit");
  const related_to_special_lab = normalizeOptionalBoolean(
    payload.related_to_special_lab,
    "related_to_special_lab"
  );
  const department = normalizeText(payload.department) || null;
  const competition_name = normalizeText(payload.competition_name) || null;
  const total_level_of_competition =
    normalizeText(payload.total_level_of_competition) || null;
  const registration_link = normalizeUrl(payload.registration_link, "registration_link");
  const selected_resources = normalizeText(payload.selected_resources) || null;
  const maximum_count = normalizeOptionalNonNegativeInteger(
    payload.maximum_count,
    "maximum_count"
  );
  const applied_count = normalizeOptionalNonNegativeInteger(
    payload.applied_count,
    "applied_count"
  );
  const apply_by_student = normalizeOptionalBoolean(
    payload.apply_by_student,
    "apply_by_student"
  );
  const start_date = normalizeDate(payload.start_date);
  const end_date = normalizeDate(payload.end_date);
  const registration_start_date = normalizeDate(payload.registration_start_date);
  const registration_end_date = normalizeDate(payload.registration_end_date);
  const min_members = normalizeOptionalPositiveInteger(payload.min_members, "min_members");
  const max_members = normalizeOptionalPositiveInteger(payload.max_members, "max_members");
  const status = normalizeStatus(payload.status);
  const eligible_for_rewards = normalizeOptionalBoolean(
    payload.eligible_for_rewards,
    "eligible_for_rewards"
  );
  const winner_rewards = normalizeText(payload.winner_rewards) || null;
  const reward_allocation = normalizeText(payload.reward_allocation) || null;
  const description = normalizeText(payload.description) || null;

  if (!event_code) throw new Error("event_code is required");
  if (!event_name) throw new Error("event_name is required");
  if (start_date && end_date && start_date > end_date) {
    throw new Error("start_date cannot be after end_date");
  }
  if (
    registration_start_date &&
    registration_end_date &&
    registration_start_date > registration_end_date
  ) {
    throw new Error("registration_start_date cannot be after registration_end_date");
  }
  if (
    min_members !== null &&
    max_members !== null &&
    Number(min_members) > Number(max_members)
  ) {
    throw new Error("min_members cannot be greater than max_members");
  }
  if (
    maximum_count !== null &&
    applied_count !== null &&
    Number(applied_count) > Number(maximum_count)
  ) {
    throw new Error("applied_count cannot be greater than maximum_count");
  }

  return {
    event_code,
    event_name,
    event_organizer,
    event_category,
    location,
    event_level,
    state,
    country,
    within_bit: within_bit === null ? false : within_bit,
    related_to_special_lab:
      related_to_special_lab === null ? false : related_to_special_lab,
    department,
    competition_name,
    total_level_of_competition,
    registration_link,
    selected_resources,
    maximum_count,
    applied_count,
    apply_by_student: apply_by_student === null ? true : apply_by_student,
    start_date,
    end_date,
    registration_start_date,
    registration_end_date,
    min_members,
    max_members,
    status,
    eligible_for_rewards:
      eligible_for_rewards === null ? false : eligible_for_rewards,
    winner_rewards,
    reward_allocation,
    description
  };
};

const ensureUniqueEventCode = async (eventCode, excludeEventId = null) => {
  const existing = await repo.getEventByCode(eventCode);
  if (!existing) return;
  if (excludeEventId && Number(existing.event_id) === Number(excludeEventId)) return;
  throw new Error("event_code already exists");
};

const mapEventRow = (row) => ({
  ...row,
  event_id: Number(row.event_id),
  maximum_count:
    row.maximum_count === null || row.maximum_count === undefined
      ? null
      : Number(row.maximum_count),
  applied_count:
    row.applied_count === null || row.applied_count === undefined
      ? null
      : Number(row.applied_count),
  min_members:
    row.min_members === null || row.min_members === undefined ? null : Number(row.min_members),
  max_members:
    row.max_members === null || row.max_members === undefined ? null : Number(row.max_members),
  apply_by_student: normalizeBooleanOrNull(row.apply_by_student),
  within_bit: normalizeBooleanOrNull(row.within_bit),
  related_to_special_lab: normalizeBooleanOrNull(row.related_to_special_lab),
  eligible_for_rewards: normalizeBooleanOrNull(row.eligible_for_rewards),
  team_count: Number(row.team_count) || 0,
  duration_days:
    row.duration_days !== undefined && row.duration_days !== null
      ? Number(row.duration_days)
      : calculateDurationDays(row.start_date, row.end_date),
  balance_count:
    row.balance_count !== undefined && row.balance_count !== null
      ? Number(row.balance_count)
      : calculateBalanceCount(row.maximum_count, row.applied_count)
});

const createEvent = async (payload, actorUserId = null) => {
  const normalized = normalizePayload({
    ...payload,
    status: payload?.status || "ACTIVE"
  });
  await ensureUniqueEventCode(normalized.event_code);

  const result = await repo.createEvent(
    {
      ...normalized,
      created_by: actorUserId || null
    }
  );

  return { event_id: result.insertId };
};

const getEvents = async () => {
  const rows = await repo.getAllEvents();
  return (rows || []).map(mapEventRow);
};

const getEvent = async (eventId) => {
  const row = await repo.getEventById(eventId);
  return row ? mapEventRow(row) : null;
};

const updateEvent = async (eventId, payload) => {
  const existing = await repo.getEventById(eventId);
  if (!existing) throw new Error("Event not found");

  const normalized = normalizePayload({
    event_code: payload?.event_code ?? existing.event_code,
    event_name: payload?.event_name ?? existing.event_name,
    event_organizer:
      payload?.event_organizer !== undefined
        ? payload.event_organizer
        : existing.event_organizer,
    event_category:
      payload?.event_category !== undefined ? payload.event_category : existing.event_category,
    location: payload?.location !== undefined ? payload.location : existing.location,
    event_level:
      payload?.event_level !== undefined ? payload.event_level : existing.event_level,
    state: payload?.state !== undefined ? payload.state : existing.state,
    country: payload?.country !== undefined ? payload.country : existing.country,
    within_bit:
      payload?.within_bit !== undefined ? payload.within_bit : existing.within_bit,
    related_to_special_lab:
      payload?.related_to_special_lab !== undefined
        ? payload.related_to_special_lab
        : existing.related_to_special_lab,
    department:
      payload?.department !== undefined ? payload.department : existing.department,
    competition_name:
      payload?.competition_name !== undefined
        ? payload.competition_name
        : existing.competition_name,
    total_level_of_competition:
      payload?.total_level_of_competition !== undefined
        ? payload.total_level_of_competition
        : existing.total_level_of_competition,
    registration_link:
      payload?.registration_link !== undefined
        ? payload.registration_link
        : existing.registration_link,
    selected_resources:
      payload?.selected_resources !== undefined
        ? payload.selected_resources
        : existing.selected_resources,
    maximum_count:
      payload?.maximum_count !== undefined ? payload.maximum_count : existing.maximum_count,
    applied_count:
      payload?.applied_count !== undefined ? payload.applied_count : existing.applied_count,
    apply_by_student:
      payload?.apply_by_student !== undefined
        ? payload.apply_by_student
        : existing.apply_by_student,
    start_date:
      payload?.start_date !== undefined ? payload.start_date : existing.start_date,
    end_date: payload?.end_date !== undefined ? payload.end_date : existing.end_date,
    registration_start_date:
      payload?.registration_start_date !== undefined
        ? payload.registration_start_date
        : existing.registration_start_date,
    registration_end_date:
      payload?.registration_end_date !== undefined
        ? payload.registration_end_date
        : existing.registration_end_date,
    min_members:
      payload?.min_members !== undefined ? payload.min_members : existing.min_members,
    max_members:
      payload?.max_members !== undefined ? payload.max_members : existing.max_members,
    status: payload?.status ?? existing.status,
    eligible_for_rewards:
      payload?.eligible_for_rewards !== undefined
        ? payload.eligible_for_rewards
        : existing.eligible_for_rewards,
    winner_rewards:
      payload?.winner_rewards !== undefined
        ? payload.winner_rewards
        : existing.winner_rewards,
    reward_allocation:
      payload?.reward_allocation !== undefined
        ? payload.reward_allocation
        : existing.reward_allocation,
    description:
      payload?.description !== undefined ? payload.description : existing.description
  });

  await ensureUniqueEventCode(normalized.event_code, eventId);
  await repo.updateEvent(eventId, normalized);
  return { event_id: Number(eventId) };
};

const setEventStatus = async (eventId, status) => {
  const existing = await repo.getEventById(eventId);
  if (!existing) throw new Error("Event not found");
  const normalized = normalizeStatus(status);
  await repo.setEventStatus(eventId, normalized);
  return { event_id: Number(eventId), status: normalized };
};

const activateEvent = async (eventId) => setEventStatus(eventId, "ACTIVE");
const closeEvent = async (eventId) => setEventStatus(eventId, "CLOSED");
const archiveEvent = async (eventId) => setEventStatus(eventId, "ARCHIVED");
const deleteEvent = async (eventId) => setEventStatus(eventId, "INACTIVE");

module.exports = {
  EVENT_STATUSES,
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  setEventStatus,
  activateEvent,
  closeEvent,
  archiveEvent,
  deleteEvent
};
