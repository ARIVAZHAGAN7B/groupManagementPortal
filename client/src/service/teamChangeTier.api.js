import {
  CLIENT_CACHE_TAGS,
  CLIENT_CACHE_STORAGE,
  CLIENT_CACHE_TTL,
  cachedGet,
  postWithInvalidation
} from "../lib/api";

export async function fetchPhaseTierChangePreview(phaseId) {
  return cachedGet(`/api/team-change-tier/phases/${phaseId}/preview`, {}, {
    storage: CLIENT_CACHE_STORAGE.MEMORY,
    tags: [CLIENT_CACHE_TAGS.TEAM_TIER_CHANGE],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
}

export async function fetchPhaseWiseTeamChangeTier(phaseId) {
  return cachedGet(`/api/team-change-tier/phases/${phaseId}`, {}, {
    storage: CLIENT_CACHE_STORAGE.MEMORY,
    tags: [CLIENT_CACHE_TAGS.TEAM_TIER_CHANGE],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
}

export async function applyTeamChangeTier(phaseId, groupId, payload = {}) {
  return postWithInvalidation(
    `/api/team-change-tier/phases/${phaseId}/groups/${groupId}/apply`,
    payload,
    {
      invalidateTags: [
        CLIENT_CACHE_TAGS.TEAM_TIER_CHANGE,
        CLIENT_CACHE_TAGS.GROUPS,
        CLIENT_CACHE_TAGS.LEADERBOARDS,
        CLIENT_CACHE_TAGS.GROUP_ELIGIBILITY
      ]
    }
  );
}
