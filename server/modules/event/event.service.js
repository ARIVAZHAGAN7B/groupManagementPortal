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

const normalizePayload = (payload = {}) => {
  const event_code = normalizeCode(payload.event_code);
  const event_name = normalizeText(payload.event_name);
  const location = normalizeText(payload.location) || null;
  const registration_link = normalizeUrl(payload.registration_link, "registration_link");
  const start_date = normalizeDate(payload.start_date);
  const end_date = normalizeDate(payload.end_date);
  const registration_start_date = normalizeDate(payload.registration_start_date);
  const registration_end_date = normalizeDate(payload.registration_end_date);
  const min_members = normalizeOptionalPositiveInteger(payload.min_members, "min_members");
  const max_members = normalizeOptionalPositiveInteger(payload.max_members, "max_members");
  const status = normalizeStatus(payload.status);
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

  return {
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
  min_members:
    row.min_members === null || row.min_members === undefined ? null : Number(row.min_members),
  max_members:
    row.max_members === null || row.max_members === undefined ? null : Number(row.max_members),
  team_count: Number(row.team_count) || 0
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
    location: payload?.location !== undefined ? payload.location : existing.location,
    registration_link:
      payload?.registration_link !== undefined
        ? payload.registration_link
        : existing.registration_link,
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
