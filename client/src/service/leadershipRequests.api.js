import { api } from "../lib/api";

export async function applyLeadershipRoleRequest({ group_id, requested_role, request_reason }) {
  const { data } = await api.post("/api/leadership-requests/apply", {
    group_id,
    requested_role,
    ...(request_reason ? { request_reason } : {})
  });
  return data;
}

export async function getMyLeadershipRoleRequests() {
  const { data } = await api.get("/api/leadership-requests/my");
  return data;
}

export async function getPendingLeadershipRequestsByGroup(groupId) {
  const { data } = await api.get(`/api/leadership-requests/group/${groupId}/pending`);
  return data;
}

export async function getAllPendingLeadershipRequests() {
  const { data } = await api.get("/api/leadership-requests/pending");
  return data;
}

export async function decideLeadershipRoleRequest(requestId, status, decision_reason) {
  const { data } = await api.put(`/api/leadership-requests/${requestId}/decision`, {
    status,
    decision_reason
  });
  return data;
}

export async function fetchAdminLeadershipNotifications() {
  const { data } = await api.get("/api/leadership-requests/admin/notifications");
  return data;
}
