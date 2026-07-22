import {
  CLIENT_CACHE_TAGS,
  CLIENT_CACHE_TTL,
  cachedGet,
  deleteWithInvalidation,
  postWithInvalidation,
  putWithInvalidation
} from "../lib/api";

const HUB_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.EVENTS,
  CLIENT_CACHE_TAGS.HUBS,
  CLIENT_CACHE_TAGS.HUB_MEMBERSHIPS
];

export async function fetchHubs(params = {}) {
  const data = await cachedGet("/api/hubs", { params }, {
    tags: [CLIENT_CACHE_TAGS.HUBS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchHubById(id) {
  return cachedGet(`/api/hubs/${id}`, {}, {
    tags: [CLIENT_CACHE_TAGS.HUBS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
}

export async function fetchMyHubMemberships(params = {}) {
  const data = await cachedGet("/api/hubs/my-memberships", { params }, {
    tags: [CLIENT_CACHE_TAGS.HUB_MEMBERSHIPS],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
  return data;
}

export async function fetchAllHubMemberships(params = {}) {
  return cachedGet("/api/hubs/memberships", { params }, {
    tags: [CLIENT_CACHE_TAGS.HUB_MEMBERSHIPS],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
}

export async function fetchHubMemberships(hubId, params = {}) {
  const data = await cachedGet(`/api/hubs/${hubId}/memberships`, { params }, {
    tags: [CLIENT_CACHE_TAGS.HUB_MEMBERSHIPS],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
  return Array.isArray(data) ? data : [];
}

export async function joinHub(hubId, payload = {}) {
  return postWithInvalidation(`/api/hubs/${hubId}/join`, payload, {
    invalidateTags: HUB_INVALIDATION_TAGS
  });
}

export async function createHub(payload) {
  return postWithInvalidation("/api/hubs", payload, {
    invalidateTags: HUB_INVALIDATION_TAGS
  });
}

export async function updateHub(id, payload) {
  return putWithInvalidation(`/api/hubs/${id}`, payload, {
    invalidateTags: HUB_INVALIDATION_TAGS
  });
}

export async function updateHubMembership(membershipId, payload) {
  return putWithInvalidation(`/api/hubs/memberships/${membershipId}`, payload, {
    invalidateTags: HUB_INVALIDATION_TAGS
  });
}

export async function activateHub(id) {
  return putWithInvalidation(`/api/hubs/${id}/activate`, undefined, {
    invalidateTags: HUB_INVALIDATION_TAGS
  });
}

export async function freezeHub(id) {
  return putWithInvalidation(`/api/hubs/${id}/freeze`, undefined, {
    invalidateTags: HUB_INVALIDATION_TAGS
  });
}

export async function archiveHub(id) {
  return putWithInvalidation(`/api/hubs/${id}/archive`, undefined, {
    invalidateTags: HUB_INVALIDATION_TAGS
  });
}

export async function deleteHub(id) {
  return deleteWithInvalidation(`/api/hubs/${id}`, {}, {
    invalidateTags: HUB_INVALIDATION_TAGS
  });
}

export async function leaveHubMembership(membershipId, payload = {}) {
  return deleteWithInvalidation(`/api/hubs/memberships/${membershipId}`, { data: payload }, {
    invalidateTags: HUB_INVALIDATION_TAGS
  });
}
