const db = require("../../config/db");
const repo = require("./event.repository");
const participationService = require("./eventParticipation.service");
const hubRepo = require("../hub/hub.repository");
const teamRepo = require("../team/team.repository");

const EVENT_STATUSES = ["ACTIVE", "CLOSED", "INACTIVE", "ARCHIVED"];
const EVENT_ROUND_STATUSES = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"];
const EVENT_ROUND_MODES = ["ONLINE", "OFFLINE"];
const EVENT_REGISTRATION_MODES = ["TEAM", "INDIVIDUAL"];

const normalizeText = (value) => String(value || "").trim();
const normalizeCode = (value) => normalizeText(value).toUpperCase();
const normalizeUrl = (value, fieldName) => {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(normalized)
    ? normalized
    : `https://${normalized}`;

  try {
    const parsed = new URL(candidate);
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

const normalizeRoundStatus = (value) => {
  const normalized = normalizeText(value).toUpperCase() || "SCHEDULED";
  if (!EVENT_ROUND_STATUSES.includes(normalized)) {
    throw new Error(
      `round status must be one of: ${EVENT_ROUND_STATUSES.join(", ")}`
    );
  }
  return normalized;
};

const normalizeRoundMode = (value) => {
  const normalized = normalizeText(value).toUpperCase() || "ONLINE";
  if (!EVENT_ROUND_MODES.includes(normalized)) {
    throw new Error(`round mode must be one of: ${EVENT_ROUND_MODES.join(", ")}`);
  }
  return normalized;
};

const normalizeRegistrationMode = (value) => {
  const normalized = normalizeText(value).toUpperCase() || "TEAM";
  if (!EVENT_REGISTRATION_MODES.includes(normalized)) {
    throw new Error(
      `registration_mode must be one of: ${EVENT_REGISTRATION_MODES.join(", ")}`
    );
  }
  return normalized;
};

const normalizeDate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date value");
  return d.toISOString().split("T")[0];
};

const normalizeTime = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).trim();
  if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(normalized)) {
    throw new Error(`${fieldName} must be a valid time`);
  }
  return normalized.length === 5 ? `${normalized}:00` : normalized;
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

const normalizeAllowedHubIds = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (!Array.isArray(value)) {
    throw new Error("allowed_hub_ids must be an array");
  }

  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  );
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

const normalizeRounds = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error("rounds must be an array");
  }

  return value.map((row, index) => {
    const round_name = normalizeText(row?.round_name);
    const round_date = normalizeDate(row?.round_date);
    const round_end_date = normalizeDate(row?.round_end_date);
    const start_time = normalizeTime(row?.start_time, "round start_time");
    const end_time = normalizeTime(row?.end_time, "round end_time");
    const location = normalizeText(row?.location) || null;
    const description = normalizeText(row?.description) || null;
    const round_mode = normalizeRoundMode(row?.round_mode);
    const status = normalizeRoundStatus(row?.status);

    if (!round_name) {
      throw new Error(`rounds[${index}].round_name is required`);
    }

    if (round_date && round_end_date && round_end_date < round_date) {
      throw new Error(`rounds[${index}] end date cannot be before start date`);
    }

    if (
      round_date &&
      start_time &&
      end_time &&
      (!round_end_date || round_end_date === round_date) &&
      start_time > end_time
    ) {
      throw new Error(`rounds[${index}] end_time cannot be before start_time`);
    }

    return {
      round_order: index + 1,
      round_name,
      round_date,
      round_end_date: round_end_date || round_date || null,
      start_time,
      end_time,
      location,
      description,
      round_mode,
      status
    };
  });
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
  const apply_by_student = normalizeOptionalBoolean(
    payload.apply_by_student,
    "apply_by_student"
  );
  const registration_mode = normalizeRegistrationMode(payload.registration_mode);
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
  const rounds = normalizeRounds(payload.rounds);
  const allowed_hub_ids = normalizeAllowedHubIds(payload.allowed_hub_ids);

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
    Number(maximum_count) < 0
  ) {
    throw new Error("maximum_count must be a non-negative integer");
  }

  const normalizedMinMembers = registration_mode === "INDIVIDUAL" ? 1 : min_members;
  const normalizedMaxMembers = registration_mode === "INDIVIDUAL" ? 1 : max_members;

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
    apply_by_student: apply_by_student === null ? true : apply_by_student,
    registration_mode,
    start_date,
    end_date,
    registration_start_date,
    registration_end_date,
    min_members: normalizedMinMembers,
    max_members: normalizedMaxMembers,
    status,
    eligible_for_rewards:
      eligible_for_rewards === null ? false : eligible_for_rewards,
    winner_rewards,
    reward_allocation,
    description,
    rounds,
    allowed_hub_ids
  };
};

const ensureUniqueEventCode = async (eventCode, excludeEventId = null, executor = undefined) => {
  const existing = await repo.getEventByCode(eventCode, executor);
  if (!existing) return;
  if (excludeEventId && Number(existing.event_id) === Number(excludeEventId)) return;
  throw new Error("event_code already exists");
};

const mapRoundRow = (row) => ({
  ...row,
  round_id: Number(row.round_id),
  event_id: Number(row.event_id),
  round_order: Number(row.round_order),
  round_end_date: row.round_end_date || row.round_date || null,
  round_mode: normalizeText(row.round_mode).toUpperCase() || "ONLINE"
});

const mapAllowedHubRow = (row) => ({
  event_id:
    row?.event_id === undefined || row?.event_id === null ? null : Number(row.event_id),
  hub_id: Number(row?.hub_id),
  team_id: Number(row?.hub_id),
  team_code: row?.team_code || null,
  team_name: row?.team_name || null,
  team_type: row?.team_type || "HUB",
  hub_priority: normalizeText(row?.hub_priority).toUpperCase() || null,
  status: row?.status || null
});

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
  registration_mode: normalizeText(row.registration_mode).toUpperCase() || "TEAM",
  within_bit: normalizeBooleanOrNull(row.within_bit),
  related_to_special_lab: normalizeBooleanOrNull(row.related_to_special_lab),
  eligible_for_rewards: normalizeBooleanOrNull(row.eligible_for_rewards),
  total_team_count: Number(row.total_team_count) || 0,
  active_team_count: Number(row.active_team_count) || 0,
  valid_team_count: Number(row.valid_team_count) || 0,
  forming_team_count: Number(row.forming_team_count) || 0,
  team_count: Number(row.team_count) || 0,
  duration_days:
    row.duration_days !== undefined && row.duration_days !== null
      ? Number(row.duration_days)
      : calculateDurationDays(row.start_date, row.end_date),
  balance_count:
    row.balance_count !== undefined && row.balance_count !== null
      ? Number(row.balance_count)
      : calculateBalanceCount(row.maximum_count, row.applied_count),
  rounds: Array.isArray(row.rounds) ? row.rounds.map(mapRoundRow) : undefined,
  allowed_hubs: Array.isArray(row.allowed_hubs) ? row.allowed_hubs.map(mapAllowedHubRow) : [],
  allowed_hub_ids: Array.isArray(row.allowed_hubs)
    ? row.allowed_hubs.map((hub) => Number(hub?.hub_id ?? hub?.team_id)).filter(Boolean)
    : [],
  allowed_hub_count: Array.isArray(row.allowed_hubs) ? row.allowed_hubs.length : 0,
  hub_restriction_enabled: Array.isArray(row.allowed_hubs) && row.allowed_hubs.length > 0
});

const attachEventRelations = async (row, executor = undefined) => {
  if (!row?.event_id) return row ? mapEventRow(row) : null;
  const [rounds, allowedHubs] = await Promise.all([
    repo.getRoundsByEventId(row.event_id, executor),
    repo.getAllowedHubsByEventId(row.event_id, executor)
  ]);
  return mapEventRow({
    ...row,
    rounds,
    allowed_hubs: allowedHubs
  });
};

const attachEventRelationsToRows = async (rows = [], executor = undefined) => {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  const eventIds = Array.from(
    new Set(
      normalizedRows
        .map((row) => Number(row?.event_id))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );

  if (eventIds.length === 0) {
    return normalizedRows.map(mapEventRow);
  }

  const allowedHubRows = await repo.getAllowedHubsByEventIds(eventIds, executor);
  const hubsByEventId = allowedHubRows.reduce((map, row) => {
    const eventId = Number(row?.event_id);
    if (!map.has(eventId)) {
      map.set(eventId, []);
    }
    map.get(eventId).push(row);
    return map;
  }, new Map());

  return normalizedRows.map((row) =>
    mapEventRow({
      ...row,
      allowed_hubs: hubsByEventId.get(Number(row?.event_id)) || []
    })
  );
};

const ensureAllowedHubsExist = async (allowedHubIds = [], executor = undefined) => {
  const normalizedHubIds = normalizeAllowedHubIds(allowedHubIds);
  if (normalizedHubIds.length === 0) {
    return [];
  }

  const hubRows = await hubRepo.getHubsByIds(normalizedHubIds, executor);
  if (hubRows.length !== normalizedHubIds.length) {
    const foundIds = new Set(hubRows.map((row) => Number(row.hub_id)));
    const missingHubId = normalizedHubIds.find((hubId) => !foundIds.has(Number(hubId)));
    throw new Error(`Hub ${missingHubId} not found`);
  }

  for (const hubRow of hubRows) {
    if (normalizeText(hubRow?.status).toUpperCase() !== "ACTIVE") {
      throw new Error(`Hub ${hubRow?.hub_code || hubRow?.hub_id} must be ACTIVE`);
    }
  }

  return normalizedHubIds;
};

const haveSameIdList = (left = [], right = []) => {
  const leftIds = normalizeAllowedHubIds(left).sort((a, b) => a - b);
  const rightIds = normalizeAllowedHubIds(right).sort((a, b) => a - b);

  if (leftIds.length !== rightIds.length) return false;
  return leftIds.every((value, index) => value === rightIds[index]);
};

const replaceEventRounds = async (eventId, rounds, executor) => {
  await repo.deleteRoundsByEventId(eventId, executor);

  for (const round of Array.isArray(rounds) ? rounds : []) {
    await repo.createEventRound(
      {
        ...round,
        event_id: Number(eventId)
      },
      executor
    );
  }
};

const ensureRoundsDoNotConflictWithExistingProgress = async (
  eventId,
  rounds,
  executor
) => {
  if (rounds === undefined) return;

  const maxRoundsCleared = await teamRepo.getMaxRoundsClearedByEvent(eventId, executor);
  const configuredRounds = Array.isArray(rounds) ? rounds.length : 0;

  if (Number(maxRoundsCleared) > configuredRounds) {
    throw new Error(
      `Some event teams already show ${maxRoundsCleared} rounds cleared. Configure at least ${maxRoundsCleared} round(s).`
    );
  }
};

const createEvent = async (payload, actorUserId = null) => {
  const normalized = normalizePayload({
    ...payload,
    status: payload?.status || "ACTIVE",
    registration_mode: payload?.registration_mode || "TEAM"
  });
  await ensureUniqueEventCode(normalized.event_code);
  await ensureAllowedHubsExist(normalized.allowed_hub_ids);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const result = await repo.createEvent(
      {
        ...normalized,
        created_by: actorUserId || null
      },
      conn
    );

    await replaceEventRounds(result.insertId, normalized.rounds || [], conn);
    await repo.replaceAllowedHubs(result.insertId, normalized.allowed_hub_ids, conn);
    await participationService.syncEventParticipationCounts(
      result.insertId,
      {
        eventLike: {
          ...normalized,
          event_id: result.insertId
        },
        requiredMinMembers: normalized.min_members,
        maximumCount: normalized.maximum_count
      },
      conn
    );

    await conn.commit();
    return { event_id: result.insertId };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const getEvents = async () => {
  const rows = await repo.getAllEvents();
  return attachEventRelationsToRows(rows || []);
};

const getEvent = async (eventId) => {
  const row = await repo.getEventById(eventId);
  return row ? attachEventRelations(row) : null;
};

const updateEvent = async (eventId, payload) => {
  const existing = await repo.getEventById(eventId);
  if (!existing) throw new Error("Event not found");
  const existingAllowedHubIds = await repo.getAllowedHubIdsByEventId(eventId);

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
    apply_by_student:
      payload?.apply_by_student !== undefined
        ? payload.apply_by_student
        : existing.apply_by_student,
    registration_mode:
      payload?.registration_mode !== undefined
        ? payload.registration_mode
        : existing.registration_mode,
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
      payload?.description !== undefined ? payload.description : existing.description,
    rounds: payload?.rounds,
    allowed_hub_ids:
      payload?.allowed_hub_ids !== undefined
        ? payload.allowed_hub_ids
        : existingAllowedHubIds
  });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await ensureUniqueEventCode(normalized.event_code, eventId, conn);
    await ensureAllowedHubsExist(normalized.allowed_hub_ids, conn);
    if (
      normalized.registration_mode !==
        (normalizeText(existing.registration_mode).toUpperCase() || "TEAM") &&
      Number(existing.total_team_count) > 0
    ) {
      throw new Error(
        "registration_mode cannot be changed after students have already registered"
      );
    }

    if (
      !haveSameIdList(existingAllowedHubIds, normalized.allowed_hub_ids) &&
      Number(existing.total_team_count) > 0
    ) {
      throw new Error("allowed hubs cannot be changed after students have already registered");
    }

    const lockedEvent = await repo.lockEventById(eventId, conn);
    if (!lockedEvent) throw new Error("Event not found");

    await ensureRoundsDoNotConflictWithExistingProgress(eventId, normalized.rounds, conn);
    await participationService.ensureEventConfigurationCapacity(
      eventId,
      {
        eventLike: {
          ...lockedEvent,
          ...normalized
        },
        requiredMinMembers: normalized.min_members,
        maximumCount: normalized.maximum_count
      },
      conn
    );
    await repo.updateEvent(eventId, normalized, conn);
    await repo.replaceAllowedHubs(eventId, normalized.allowed_hub_ids, conn);

    if (normalized.rounds !== undefined) {
      await replaceEventRounds(eventId, normalized.rounds, conn);
    }

    await participationService.syncEventParticipationCounts(
      eventId,
      {
        eventLike: {
          ...lockedEvent,
          ...normalized,
          event_id: Number(eventId)
        },
        requiredMinMembers: normalized.min_members,
        maximumCount: normalized.maximum_count
      },
      conn
    );

    await conn.commit();
    return { event_id: Number(eventId) };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
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
  EVENT_ROUND_STATUSES,
  EVENT_ROUND_MODES,
  EVENT_REGISTRATION_MODES,
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
