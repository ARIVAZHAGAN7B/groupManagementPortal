import {
  api,
  CLIENT_CACHE_TAGS,
  CLIENT_CACHE_STORAGE,
  CLIENT_CACHE_TTL,
  cachedGet,
  postWithInvalidation,
  putWithInvalidation,
  deleteWithInvalidation
} from "../lib/api";

const TEAM_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.EVENTS,
  CLIENT_CACHE_TAGS.TEAMS,
  CLIENT_CACHE_TAGS.TEAM_MEMBERSHIPS,
  CLIENT_CACHE_TAGS.TEAM_TARGETS
];

export async function fetchTeams(params = {}) {
  const data = await cachedGet("/api/teams", { params }, {
    tags: [CLIENT_CACHE_TAGS.TEAMS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchHubs(params = {}) {
  return fetchTeams({ team_type: "HUB", ...params });
}

export async function fetchTeamsByEvent(eventId, params = {}) {
  const data = await cachedGet(`/api/teams/event/${eventId}`, { params }, {
    tags: [CLIENT_CACHE_TAGS.TEAMS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchEventGroups(params = {}) {
  const merged = { team_type: "EVENT", ...params };
  const data = await cachedGet("/api/event-groups", { params: merged }, {
    tags: [CLIENT_CACHE_TAGS.TEAMS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchEventGroupsByEvent(eventId, params = {}) {
  const merged = { team_type: "EVENT", ...params };
  const data = await cachedGet(`/api/event-groups/event/${eventId}`, { params: merged }, {
    tags: [CLIENT_CACHE_TAGS.TEAMS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchTeamById(id) {
  return cachedGet(`/api/teams/${id}`, {}, {
    tags: [CLIENT_CACHE_TAGS.TEAMS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
}

export async function fetchEventGroupById(id) {
  return cachedGet(`/api/event-groups/${id}`, {}, {
    tags: [CLIENT_CACHE_TAGS.TEAMS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
}

export async function fetchMyTeamMemberships(params = {}) {
  const { data } = await api.get("/api/teams/my-memberships", { params });
  return data; // { student_id, memberships }
}

export async function fetchAllTeamMemberships(params = {}) {
  const { data } = await api.get("/api/teams/memberships", { params });
  return data;
}

export async function fetchMyEventGroupMemberships(params = {}) {
  const merged = { team_type: "EVENT", ...params };
  const { data } = await api.get("/api/event-groups/my-memberships", { params: merged });
  return data;
}

export async function fetchTeamMemberships(teamId, params = {}) {
  const data = await cachedGet(`/api/teams/${teamId}/memberships`, { params }, {
    storage: CLIENT_CACHE_STORAGE.MEMORY,
    tags: [CLIENT_CACHE_TAGS.TEAM_MEMBERSHIPS],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchEventGroupMemberships(teamId, params = {}) {
  const data = await cachedGet(`/api/event-groups/${teamId}/memberships`, { params }, {
    storage: CLIENT_CACHE_STORAGE.MEMORY,
    tags: [CLIENT_CACHE_TAGS.TEAM_MEMBERSHIPS],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
  return Array.isArray(data) ? data : [];
}

export async function joinTeam(teamId, payload = {}) {
  return postWithInvalidation(`/api/teams/${teamId}/join`, payload, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function addTeamMember(teamId, payload) {
  return postWithInvalidation(`/api/teams/${teamId}/memberships`, payload, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function createEventTeam(eventId, payload) {
  return postWithInvalidation(`/api/event-groups/event/${eventId}`, payload, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function createEventGroup(eventId, payload) {
  return createEventTeam(eventId, payload);
}

export async function createTeam(payload) {
  return postWithInvalidation("/api/teams", payload, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function createHub(payload) {
  return createTeam({ ...payload, team_type: "HUB" });
}

export async function updateEventGroup(id, payload) {
  return putWithInvalidation(`/api/event-groups/${id}`, payload, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function updateTeam(id, payload) {
  return putWithInvalidation(`/api/teams/${id}`, payload, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function updateHub(id, payload) {
  return updateTeam(id, { ...payload, team_type: "HUB" });
}

export async function updateTeamMembership(membershipId, payload) {
  return putWithInvalidation(`/api/teams/memberships/${membershipId}`, payload, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function activateTeam(id) {
  return putWithInvalidation(`/api/teams/${id}/activate`, undefined, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function activateHub(id) {
  return activateTeam(id);
}

export async function activateEventGroup(id) {
  return putWithInvalidation(`/api/event-groups/${id}/activate`, undefined, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function freezeTeam(id) {
  return putWithInvalidation(`/api/teams/${id}/freeze`, undefined, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function freezeHub(id) {
  return freezeTeam(id);
}

export async function freezeEventGroup(id) {
  return putWithInvalidation(`/api/event-groups/${id}/freeze`, undefined, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function archiveTeam(id) {
  return putWithInvalidation(`/api/teams/${id}/archive`, undefined, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function archiveHub(id) {
  return archiveTeam(id);
}

export async function archiveEventGroup(id) {
  return putWithInvalidation(`/api/event-groups/${id}/archive`, undefined, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function deleteTeam(id) {
  return deleteWithInvalidation(`/api/teams/${id}`, {}, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function deleteHub(id) {
  return deleteTeam(id);
}

export async function leaveTeamMembership(membershipId, payload = {}) {
  return deleteWithInvalidation(`/api/teams/memberships/${membershipId}`, { data: payload }, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}

export async function deleteEventGroup(id) {
  return deleteWithInvalidation(`/api/event-groups/${id}`, {}, {
    invalidateTags: TEAM_INVALIDATION_TAGS
  });
}
