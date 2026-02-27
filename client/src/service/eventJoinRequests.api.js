import { api } from "../lib/api";

export async function applyEventJoinRequest(teamId) {
  const { data } = await api.post("/api/event-group-join-requests/apply", {
    team_id: teamId
  });
  return data;
}

export async function getMyEventJoinRequests() {
  const { data } = await api.get("/api/event-group-join-requests/my");
  return Array.isArray(data) ? data : [];
}

export async function getPendingEventJoinRequestsByTeam(teamId) {
  const { data } = await api.get(`/api/event-group-join-requests/team/${teamId}/pending`);
  return Array.isArray(data) ? data : [];
}

export async function decideEventJoinRequest(
  requestId,
  status,
  decision_reason,
  approved_role = undefined
) {
  const payload = {
    status,
    decision_reason
  };

  if (approved_role) {
    payload.approved_role = approved_role;
  }

  const { data } = await api.put(
    `/api/event-group-join-requests/${requestId}/decision`,
    payload
  );
  return data;
}
