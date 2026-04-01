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

const MEMBERSHIP_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.GROUPS,
  CLIENT_CACHE_TAGS.GROUP_MEMBERSHIPS,
  CLIENT_CACHE_TAGS.GROUP_RANKS,
  CLIENT_CACHE_TAGS.LEADERBOARDS,
  CLIENT_CACHE_TAGS.GROUP_ELIGIBILITY,
  CLIENT_CACHE_TAGS.TEAM_TIER_CHANGE
];

export async function joinGroup(groupId, role) {
  return postWithInvalidation(`/api/membership/join/${groupId}`, role ? { role } : {}, {
    invalidateTags: MEMBERSHIP_INVALIDATION_TAGS
  });
}

export async function leaveGroup(groupId) {
  return postWithInvalidation("/api/membership/leave", { groupId }, {
    invalidateTags: MEMBERSHIP_INVALIDATION_TAGS
  });
}

export async function fetchGroupMembers(groupId) {
  const data = await cachedGet(`/api/membership/group/${groupId}`, {}, {
    storage: CLIENT_CACHE_STORAGE.MEMORY,
    tags: [CLIENT_CACHE_TAGS.GROUP_MEMBERSHIPS],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
  return data; // array
}

export async function fetchGroupRankHistory(groupId) {
  const data = await cachedGet(`/api/membership/group/${groupId}/rank-history`, {}, {
    tags: [CLIENT_CACHE_TAGS.GROUP_RANKS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return data; // array
}

export async function fetchGroupRankRules(groupId) {
  return cachedGet(`/api/membership/group/${groupId}/rank-rules`, {}, {
    tags: [CLIENT_CACHE_TAGS.GROUP_RANKS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
}

export async function fetchMyGroup() {
  const { data } = await api.get("/api/membership/my-group");
  return data; // { group }
}

export async function fetchAllMemberships(params = {}) {
  const { data } = await api.get("/api/membership", { params });
  return data;
}

export async function deleteMembership(membershipId, reason) {
  return deleteWithInvalidation(`/api/membership/${membershipId}`, {
    data: { reason }
  }, {
    invalidateTags: MEMBERSHIP_INVALIDATION_TAGS
  });
}

export async function updateMemberRole(membershipId, role) {
  return putWithInvalidation(`/api/membership/${membershipId}/role`, { role }, {
    invalidateTags: MEMBERSHIP_INVALIDATION_TAGS
  });
}

export async function updateMemberRank(membershipId, rank) {
  return putWithInvalidation(`/api/membership/${membershipId}/rank`, { rank }, {
    invalidateTags: MEMBERSHIP_INVALIDATION_TAGS
  });
}

export async function updateGroupRankRules(groupId, payload) {
  return putWithInvalidation(`/api/membership/group/${groupId}/rank-rules`, payload, {
    invalidateTags: MEMBERSHIP_INVALIDATION_TAGS
  });
}
