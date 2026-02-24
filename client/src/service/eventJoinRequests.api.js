import { api } from "../lib/api";

export async function applyEventJoinRequest(teamId) {
  const { data } = await api.post("/api/event-join-requests/apply", {
    team_id: teamId
  });
  return data;
}

export async function getMyEventJoinRequests() {
  const { data } = await api.get("/api/event-join-requests/my");
  return Array.isArray(data) ? data : [];
}

export async function getPendingEventJoinRequestsByTeam(teamId) {
  const { data } = await api.get(`/api/event-join-requests/team/${teamId}/pending`);
  return Array.isArray(data) ? data : [];
}

export async function decideEventJoinRequest(requestId, status, decision_reason) {
  const { data } = await api.put(`/api/event-join-requests/${requestId}/decision`, {
    status,
    decision_reason
  });
  return data;
}
