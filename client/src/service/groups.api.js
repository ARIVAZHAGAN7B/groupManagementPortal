import {
  CLIENT_CACHE_TAGS,
  CLIENT_CACHE_TTL,
  cachedGet,
  postWithInvalidation,
  putWithInvalidation,
  deleteWithInvalidation
} from "../lib/api";

const GROUP_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.GROUPS,
  CLIENT_CACHE_TAGS.GROUP_MEMBERSHIPS,
  CLIENT_CACHE_TAGS.GROUP_RANKS,
  CLIENT_CACHE_TAGS.LEADERBOARDS,
  CLIENT_CACHE_TAGS.GROUP_ELIGIBILITY,
  CLIENT_CACHE_TAGS.TEAM_TIER_CHANGE
];

export async function fetchGroups(params = {}) {
  return cachedGet("/api/groups", { params }, {
    tags: [CLIENT_CACHE_TAGS.GROUPS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
}

export async function fetchGroupById(id) {
  return cachedGet(`/api/groups/${id}`, {}, {
    tags: [CLIENT_CACHE_TAGS.GROUPS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
}

export async function createGroup(payload) {
  return postWithInvalidation("/api/groups", payload, {
    invalidateTags: GROUP_INVALIDATION_TAGS
  });
}

export async function updateGroup(id, payload) {
  return putWithInvalidation(`/api/groups/${id}`, payload, {
    invalidateTags: GROUP_INVALIDATION_TAGS
  });
}

export async function activateGroup(id) {
  return putWithInvalidation(`/api/groups/${id}/activate`, undefined, {
    invalidateTags: GROUP_INVALIDATION_TAGS
  });
}

export async function freezeGroup(id) {
  return putWithInvalidation(`/api/groups/${id}/freeze`, undefined, {
    invalidateTags: GROUP_INVALIDATION_TAGS
  });
}

export async function deleteGroup(id) {
  return deleteWithInvalidation(`/api/groups/${id}`, {}, {
    invalidateTags: GROUP_INVALIDATION_TAGS
  });
}
