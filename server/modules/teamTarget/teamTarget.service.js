const repo = require("./teamTarget.repository");
const teamRepo = require("../team/team.repository");

const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];
const TEAM_TYPES = ["TEAM", "HUB", "SECTION", "EVENT"];
const TEAM_STATUSES = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];

const normalizeText = (value) => String(value || "").trim();

const normalizeTeamId = (value) => {
  const teamId = Number(value);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    throw new Error("team_id must be a positive integer");
  }
  return teamId;
};

const normalizeOptionalTeamType = (value, field = "team_type") => {
  if (value === undefined || value === null || value === "") return undefined;
  const type = normalizeText(value).toUpperCase();
  if (!TEAM_TYPES.includes(type)) {
    throw new Error(`${field} must be one of: ${TEAM_TYPES.join(", ")}`);
  }
  return type;
};

const normalizeOptionalTeamStatus = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const status = normalizeText(value).toUpperCase();
  if (!TEAM_STATUSES.includes(status)) {
    throw new Error(`team_status must be one of: ${TEAM_STATUSES.join(", ")}`);
  }
  return status;
};

const normalizeOptionalEventId = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const eventId = Number(value);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new Error("event_id must be a positive integer");
  }
  return eventId;
};

const normalizeTargetMemberCount = (value) => {
  const count = Number(value);
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("target_member_count must be a positive integer");
  }
  return count;
};

const normalizeNotes = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const notes = normalizeText(value);
  if (notes.length > 255) {
    throw new Error("notes must be 255 characters or less");
  }
  return notes;
};

const ensureAdminActor = (actorUser) => {
  if (!actorUser?.userId || !actorUser?.role) {
    throw new Error("Unauthorized");
  }

  const role = String(actorUser.role).toUpperCase();
  if (!ADMIN_ROLES.includes(role)) {
    throw new Error("Only admin can manage team targets");
  }
};

const mapRow = (row) => ({
  ...row,
  team_id: Number(row.team_id),
  event_id: row.event_id === null || row.event_id === undefined ? null : Number(row.event_id),
  active_member_count: Number(row.active_member_count) || 0,
  team_target_id:
    row.team_target_id === null || row.team_target_id === undefined
      ? null
      : Number(row.team_target_id),
  target_member_count:
    row.target_member_count === null || row.target_member_count === undefined
      ? null
      : Number(row.target_member_count),
  target_configured:
    row.target_member_count !== null && row.target_member_count !== undefined
      ? true
      : false
});

const getTeamTargets = async (query = {}, actorUser) => {
  ensureAdminActor(actorUser);

  const rows = await repo.getAllTeamTargets({
    team_id: query?.team_id ? Number(query.team_id) : undefined,
    event_id: normalizeOptionalEventId(query?.event_id),
    team_type: normalizeOptionalTeamType(query?.team_type, "team_type"),
    exclude_team_type: normalizeOptionalTeamType(
      query?.exclude_team_type,
      "exclude_team_type"
    ),
    team_status: normalizeOptionalTeamStatus(query?.team_status)
  });

  return (rows || []).map(mapRow);
};

const getTeamTargetByTeamId = async (teamId, actorUser) => {
  ensureAdminActor(actorUser);
  const normalizedTeamId = normalizeTeamId(teamId);

  const row = await repo.getTeamTargetByTeamId(normalizedTeamId);
  if (!row) throw new Error("Team not found");

  return mapRow(row);
};

const setTeamTarget = async (teamId, payload = {}, actorUser) => {
  ensureAdminActor(actorUser);

  const normalizedTeamId = normalizeTeamId(teamId);
  const target_member_count = normalizeTargetMemberCount(payload.target_member_count);
  const notes = normalizeNotes(payload.notes);

  const team = await teamRepo.getTeamById(normalizedTeamId);
  if (!team) throw new Error("Team not found");

  await repo.upsertTeamTarget({
    team_id: normalizedTeamId,
    target_member_count,
    notes,
    updated_by: String(actorUser.userId)
  });

  const row = await repo.getTeamTargetByTeamId(normalizedTeamId);
  return mapRow(row);
};

module.exports = {
  getTeamTargets,
  getTeamTargetByTeamId,
  setTeamTarget
};
