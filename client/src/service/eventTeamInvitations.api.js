import {
  CLIENT_CACHE_TAGS,
  putWithInvalidation
} from "../lib/api";
import { api } from "../lib/api";

const EVENT_TEAM_INVITATION_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.TEAMS,
  CLIENT_CACHE_TAGS.TEAM_MEMBERSHIPS,
  CLIENT_CACHE_TAGS.EVENTS
];

export async function getMyEventTeamInvitations() {
  const { data } = await api.get("/api/event-team-invitations/my");
  return Array.isArray(data) ? data : [];
}

export async function respondToEventTeamInvitation(invitationId, payload) {
  return putWithInvalidation(
    `/api/event-team-invitations/${invitationId}/respond`,
    payload,
    {
      invalidateTags: EVENT_TEAM_INVITATION_INVALIDATION_TAGS
    }
  );
}
