const repo = require("./audit.repository");

const getIpAddress = (req) => {
  if (!req) return null;
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
};

const safeStringify = (value) => {
  if (value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return JSON.stringify({ serialization_error: true });
  }
};

const normalizeActorUserId = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const logAction = async ({
  req,
  actorUser,
  action,
  entityType,
  entityId = null,
  reasonCode = null,
  details = null
}) => {
  if (!action || !entityType) {
    throw new Error("action and entityType are required");
  }

  const auditId = await repo.insertAuditLog({
    action: String(action),
    entity_type: String(entityType),
    entity_id: entityId === undefined || entityId === null ? null : String(entityId),
    actor_user_id: normalizeActorUserId(actorUser?.userId),
    actor_role: actorUser?.role ? String(actorUser.role) : null,
    reason_code: reasonCode ? String(reasonCode) : null,
    details_json: safeStringify(details),
    ip_address: getIpAddress(req)
  });

  return { audit_id: auditId };
};

const logActionSafe = async (payload) => {
  try {
    return await logAction(payload);
  } catch (error) {
    // Best-effort logging: do not block core workflow if audit table is unavailable.
    console.error("[audit-log-failed]", error?.message || error);
    return null;
  }
};

const normalizeDateTimeBoundary = (value, endOfDay = false) => {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed} ${endOfDay ? "23:59:59" : "00:00:00"}`;
  }

  return trimmed;
};

const parsePaging = (query = {}) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.max(1, Math.min(Number(query.limit) || 50, 200))
});

const getAuditLogs = async (query = {}) => {
  const result = await repo.listAuditLogs(
    {
      action: query.action ? String(query.action).trim() : undefined,
      entity_type: query.entity_type ? String(query.entity_type).trim() : undefined,
      actor_role: query.actor_role ? String(query.actor_role).trim() : undefined,
      actor_user_id:
        query.actor_user_id === undefined || query.actor_user_id === null || query.actor_user_id === ""
          ? undefined
          : normalizeActorUserId(query.actor_user_id),
      from_date: normalizeDateTimeBoundary(query.from_date, false),
      to_date: normalizeDateTimeBoundary(query.to_date, true),
      q: query.q ? String(query.q).trim() : undefined
    },
    parsePaging(query)
  );

  return {
    ...result,
    rows: (result.rows || []).map((row) => ({
      ...row,
      actor_user_id:
        row.actor_user_id === undefined || row.actor_user_id === null
          ? null
          : Number(row.actor_user_id),
      details: row.details_json ? safeParseJson(row.details_json) : null
    }))
  };
};

const safeParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
};

module.exports = {
  logAction,
  logActionSafe,
  getAuditLogs
};
