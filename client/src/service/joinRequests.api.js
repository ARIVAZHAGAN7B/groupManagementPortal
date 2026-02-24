import { api } from "../lib/api";

export async function applyJoinRequest(groupId) {
  const { data } = await api.post("/api/join-requests/apply", { group_id: groupId });
  return data;
}

export async function getMyJoinRequests() {
  const { data } = await api.get("/api/join-requests/my");
  return data;
}

export async function getPendingRequestsByGroup(groupId) {
  const { data } = await api.get(`/api/join-requests/group/${groupId}/pending`);
  return data;
}

export async function decideJoinRequest(requestId, status, decision_reason) {
  const { data } = await api.put(`/api/join-requests/${requestId}/decision`, {
    status,
    decision_reason,
  });
  return data;
}
