import {
  api,
  CLIENT_CACHE_TAGS,
  postWithInvalidation,
  putWithInvalidation
} from "../lib/api";

const EVENT_JOIN_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.TEAMS,
  CLIENT_CACHE_TAGS.TEAM_MEMBERSHIPS,
  CLIENT_CACHE_TAGS.EVENTS
];

export async function applyEventJoinRequest(teamId) {
  return postWithInvalidation("/api/event-group-join-requests/apply", {
    team_id: teamId
  });
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

  return putWithInvalidation(
    `/api/event-group-join-requests/${requestId}/decision`,
    payload,
    {
      invalidateTags: EVENT_JOIN_INVALIDATION_TAGS
    }
  );
}
