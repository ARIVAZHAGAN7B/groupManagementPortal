const repo = require("./activityPointsWrite.repository");

const SYNC_TYPES = {
  STUDENT_GROUP_ROLE: "STUDENT_GROUP_ROLE",
  GROUP_TIER: "GROUP_TIER",
  ELIGIBILITY_STATUS: "ELIGIBILITY_STATUS",
  INCUBATION_STATUS: "INCUBATION_STATUS"
};

const normalizeText = (value) => String(value || "").trim();

const normalizeOptionalText = (value) => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const normalizeOptionalInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return parsed;
};

const normalizeOptionalBoolean = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || String(value).toLowerCase() === "true") return true;
  if (value === 0 || value === "0" || String(value).toLowerCase() === "false") return false;
  return null;
};

const mapRow = (row) => ({
  ...row,
  activity_points_write_log_id: Number(row.activity_points_write_log_id),
  group_id: row.group_id === null || row.group_id === undefined ? null : Number(row.group_id),
  payload_json:
    typeof row.payload_json === "string"
      ? (() => {
          try {
            return JSON.parse(row.payload_json);
          } catch (_error) {
            return null;
          }
        })()
      : row.payload_json
});

const recordSyncLog = async (payload = {}, executor) => {
  const sync_type = normalizeText(payload.sync_type).toUpperCase();
  if (!Object.values(SYNC_TYPES).includes(sync_type)) {
    throw new Error(`sync_type must be one of: ${Object.values(SYNC_TYPES).join(", ")}`);
  }

  const entity_key = normalizeText(payload.entity_key);
  if (!entity_key) {
    throw new Error("entity_key is required");
  }

  const syncLogId = await repo.insertSyncLog(
    {
      sync_type,
      entity_key,
      phase_id: normalizeOptionalText(payload.phase_id),
      student_id: normalizeOptionalText(payload.student_id),
      group_id: normalizeOptionalInteger(payload.group_id, "group_id"),
      payload_json: payload.payload_json || {},
      connection_mode: "MIMICKED_INTERNAL",
      status: "SYNCED",
      source_module: normalizeOptionalText(payload.source_module)
    },
    executor
  );

  const row = await repo.getSyncLogById(syncLogId, executor);
  return row ? mapRow(row) : { activity_points_write_log_id: Number(syncLogId) };
};

const recordSyncLogs = async (payloads = [], executor) => {
  const normalizedPayloads = (Array.isArray(payloads) ? payloads : [])
    .map((payload) => {
      const sync_type = normalizeText(payload.sync_type).toUpperCase();
      const entity_key = normalizeText(payload.entity_key);
      if (!sync_type || !entity_key || !Object.values(SYNC_TYPES).includes(sync_type)) {
        return null;
      }

      return {
        sync_type,
        entity_key,
        phase_id: normalizeOptionalText(payload.phase_id),
        student_id: normalizeOptionalText(payload.student_id),
        group_id: normalizeOptionalInteger(payload.group_id, "group_id"),
        payload_json: payload.payload_json || {},
        connection_mode: "MIMICKED_INTERNAL",
        status: "SYNCED",
        source_module: normalizeOptionalText(payload.source_module)
      };
    })
    .filter(Boolean);

  if (normalizedPayloads.length === 0) return [];

  await repo.insertSyncLogs(normalizedPayloads, executor);
  return normalizedPayloads;
};

const writeStudentGroupRole = async (payload = {}, executor) =>
  recordSyncLog(
    {
      sync_type: SYNC_TYPES.STUDENT_GROUP_ROLE,
      entity_key: `${normalizeText(payload.student_id)}:${normalizeText(
        payload.group_id
      )}:${normalizeText(payload.role || payload.membership_status || "MEMBER")}`,
      phase_id: payload.phase_id || null,
      student_id: payload.student_id,
      group_id: payload.group_id,
      source_module: payload.source_module || "GROUP_MEMBERSHIP",
      payload_json: {
        student_id: normalizeText(payload.student_id),
        group_id: normalizeOptionalInteger(payload.group_id, "group_id"),
        role: normalizeText(payload.role || "MEMBER").toUpperCase(),
        membership_status: normalizeText(payload.membership_status || "ACTIVE").toUpperCase(),
        sync_context: payload.sync_context || null
      }
    },
    executor
  );

const writeGroupTier = async (payload = {}, executor) =>
  recordSyncLog(
    {
      sync_type: SYNC_TYPES.GROUP_TIER,
      entity_key: `${normalizeText(payload.group_id)}:${normalizeText(payload.tier)}`,
      phase_id: payload.phase_id || null,
      group_id: payload.group_id,
      source_module: payload.source_module || "GROUP_TIER",
      payload_json: {
        group_id: normalizeOptionalInteger(payload.group_id, "group_id"),
        tier: normalizeText(payload.tier).toUpperCase(),
        previous_tier: normalizeOptionalText(payload.previous_tier),
        change_action: normalizeOptionalText(payload.change_action),
        sync_context: payload.sync_context || null
      }
    },
    executor
  );

const writeEligibilityStatus = async (payload = {}, executor) =>
  recordSyncLog(
    {
      sync_type: SYNC_TYPES.ELIGIBILITY_STATUS,
      entity_key:
        payload.group_id !== undefined && payload.group_id !== null
          ? `${normalizeText(payload.phase_id)}:GROUP:${normalizeText(payload.group_id)}`
          : `${normalizeText(payload.phase_id)}:INDIVIDUAL:${normalizeText(payload.student_id)}`,
      phase_id: payload.phase_id,
      student_id: payload.student_id || null,
      group_id: payload.group_id || null,
      source_module: payload.source_module || "ELIGIBILITY",
      payload_json: {
        phase_id: normalizeText(payload.phase_id),
        student_id: normalizeOptionalText(payload.student_id),
        group_id: normalizeOptionalInteger(payload.group_id, "group_id"),
        is_eligible: normalizeOptionalBoolean(payload.is_eligible),
        reason_code: normalizeOptionalText(payload.reason_code),
        scope:
          payload.group_id !== undefined && payload.group_id !== null ? "GROUP" : "INDIVIDUAL",
        sync_context: payload.sync_context || null
      }
    },
    executor
  );

const writeIncubationStatus = async (payload = {}, executor) =>
  recordSyncLog(
    {
      sync_type: SYNC_TYPES.INCUBATION_STATUS,
      entity_key: `${normalizeText(payload.student_id)}:${normalizeText(payload.group_id || "NA")}`,
      phase_id: payload.phase_id || null,
      student_id: payload.student_id,
      group_id: payload.group_id || null,
      source_module: payload.source_module || "INCUBATION",
      payload_json: {
        student_id: normalizeText(payload.student_id),
        group_id:
          payload.group_id === undefined || payload.group_id === null
            ? null
            : normalizeOptionalInteger(payload.group_id, "group_id"),
        incubation_end_date: payload.incubation_end_date || null,
        is_in_incubation:
          payload.is_in_incubation === undefined || payload.is_in_incubation === null
            ? null
            : Boolean(payload.is_in_incubation),
        sync_context: payload.sync_context || null
      }
    },
    executor
  );

const listSyncLogs = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(Number(query.limit) || 50, 200));
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listSyncLogs(
    {
      sync_type: query.sync_type,
      phase_id: query.phase_id,
      student_id: query.student_id,
      group_id: query.group_id,
      status: query.status,
      source_module: query.source_module
    },
    {
      limit,
      offset
    }
  );

  return {
    items: (rows || []).map(mapRow),
    total,
    page,
    limit
  };
};

module.exports = {
  SYNC_TYPES,
  recordSyncLog,
  recordSyncLogs,
  writeStudentGroupRole,
  writeGroupTier,
  writeEligibilityStatus,
  writeIncubationStatus,
  listSyncLogs
};
