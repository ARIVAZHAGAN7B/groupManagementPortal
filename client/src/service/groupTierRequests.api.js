import {
  api,
  CLIENT_CACHE_TAGS,
  postWithInvalidation,
  putWithInvalidation
} from "../lib/api";

const GROUP_TIER_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.GROUPS,
  CLIENT_CACHE_TAGS.LEADERBOARDS,
  CLIENT_CACHE_TAGS.GROUP_ELIGIBILITY,
  CLIENT_CACHE_TAGS.TEAM_TIER_CHANGE
];

export async function applyGroupTierChangeRequest({ group_id, requested_tier, request_reason }) {
  return postWithInvalidation("/api/group-tier-requests/apply", {
    group_id,
    requested_tier,
    ...(request_reason ? { request_reason } : {})
  });
}

export async function getMyGroupTierChangeRequests() {
  const { data } = await api.get("/api/group-tier-requests/my");
  return data;
}

export async function getAllPendingGroupTierChangeRequests() {
  const { data } = await api.get("/api/group-tier-requests/pending");
  return data;
}

export async function decideGroupTierChangeRequest(requestId, status, decision_reason) {
  return putWithInvalidation(`/api/group-tier-requests/${requestId}/decision`, {
    status,
    decision_reason
  }, {
    invalidateTags: GROUP_TIER_INVALIDATION_TAGS
  });
}

export async function fetchAdminGroupTierRequestNotifications() {
  const { data } = await api.get("/api/group-tier-requests/admin/notifications");
  return data;
}
