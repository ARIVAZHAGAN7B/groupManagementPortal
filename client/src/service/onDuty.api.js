import {
  CLIENT_CACHE_TAGS,
  CLIENT_CACHE_TTL,
  cachedGet,
  postWithInvalidation,
  putWithInvalidation
} from "../lib/api";

const ON_DUTY_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.ON_DUTY,
  CLIENT_CACHE_TAGS.EVENTS,
  CLIENT_CACHE_TAGS.TEAMS,
  CLIENT_CACHE_TAGS.TEAM_MEMBERSHIPS
];

export async function fetchOnDutyRequests(params = {}) {
  const data = await cachedGet("/api/on-duty", { params }, {
    tags: [CLIENT_CACHE_TAGS.ON_DUTY],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchMyOnDutyRequests() {
  return cachedGet("/api/on-duty/my", {}, {
    tags: [CLIENT_CACHE_TAGS.ON_DUTY],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
}

export async function fetchTeamOnDutyRequests(teamId) {
  const data = await cachedGet(`/api/on-duty/team/${teamId}`, {}, {
    tags: [CLIENT_CACHE_TAGS.ON_DUTY],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
  return Array.isArray(data) ? data : [];
}

export async function submitTeamOnDutyRequest(teamId, payload) {
  return postWithInvalidation(`/api/on-duty/team/${teamId}/apply`, payload, {
    invalidateTags: ON_DUTY_INVALIDATION_TAGS
  });
}

export async function reviewOnDutyRequest(id, payload) {
  return putWithInvalidation(`/api/on-duty/${id}/review`, payload, {
    invalidateTags: ON_DUTY_INVALIDATION_TAGS
  });
}

export async function fetchAdminOdEvents() {
  const data = await cachedGet("/api/on-duty/admin/events", {}, {
    tags: [CLIENT_CACHE_TAGS.ON_DUTY],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchEventTeamsWithOd(eventId) {
  const data = await cachedGet(`/api/on-duty/admin/events/${eventId}/teams`, {}, {
    tags: [CLIENT_CACHE_TAGS.ON_DUTY],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return data?.teams ? Array.isArray(data.teams) ? data.teams : [] : [];
}
