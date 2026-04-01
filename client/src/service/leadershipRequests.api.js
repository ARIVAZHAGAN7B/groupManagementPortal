import {
  api,
  CLIENT_CACHE_TAGS,
  postWithInvalidation,
  putWithInvalidation
} from "../lib/api";

const LEADERSHIP_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.GROUP_MEMBERSHIPS,
  CLIENT_CACHE_TAGS.GROUP_RANKS
];

export async function applyLeadershipRoleRequest({ group_id, requested_role, request_reason }) {
  return postWithInvalidation("/api/leadership-requests/apply", {
    group_id,
    requested_role,
    ...(request_reason ? { request_reason } : {})
  });
}

export async function getMyLeadershipRoleRequests() {
  const { data } = await api.get("/api/leadership-requests/my");
  return data;
}

export async function getPendingLeadershipRequestsByGroup(groupId) {
  const { data } = await api.get(`/api/leadership-requests/group/${groupId}/pending`);
  return data;
}

export async function getAllPendingLeadershipRequests(params = {}) {
  const { data } = await api.get("/api/leadership-requests/pending", { params });
  return data;
}

export async function decideLeadershipRoleRequest(requestId, status, decision_reason) {
  return putWithInvalidation(`/api/leadership-requests/${requestId}/decision`, {
    status,
    decision_reason
  }, {
    invalidateTags: LEADERSHIP_INVALIDATION_TAGS
  });
}

export async function fetchAdminLeadershipNotifications() {
  const { data } = await api.get("/api/leadership-requests/admin/notifications");
  return data;
}
