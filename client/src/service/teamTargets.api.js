import {
  CLIENT_CACHE_TAGS,
  CLIENT_CACHE_TTL,
  cachedGet,
  putWithInvalidation
} from "../lib/api";

export async function fetchTeamTargets(params = {}) {
  const data = await cachedGet("/api/team-targets", { params }, {
    tags: [CLIENT_CACHE_TAGS.TEAM_TARGETS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchTeamTargetByTeamId(teamId) {
  return cachedGet(`/api/team-targets/${teamId}`, {}, {
    tags: [CLIENT_CACHE_TAGS.TEAM_TARGETS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
}

export async function setTeamTarget(teamId, payload) {
  return putWithInvalidation(`/api/team-targets/${teamId}`, payload, {
    invalidateTags: [CLIENT_CACHE_TAGS.TEAM_TARGETS]
  });
}
