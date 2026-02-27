import { api } from "../lib/api";

export async function applyGroupTierChangeRequest({ group_id, requested_tier, request_reason }) {
  const { data } = await api.post("/api/group-tier-requests/apply", {
    group_id,
    requested_tier,
    ...(request_reason ? { request_reason } : {})
  });
  return data;
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
  const { data } = await api.put(`/api/group-tier-requests/${requestId}/decision`, {
    status,
    decision_reason
  });
  return data;
}

export async function fetchAdminGroupTierRequestNotifications() {
  const { data } = await api.get("/api/group-tier-requests/admin/notifications");
  return data;
}

