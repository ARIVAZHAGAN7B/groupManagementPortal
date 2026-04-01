import {
  CLIENT_CACHE_TAGS,
  CLIENT_CACHE_STORAGE,
  CLIENT_CACHE_TTL,
  cachedGet,
  postWithInvalidation,
  putWithInvalidation
} from "../lib/api";

const PHASE_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.PHASES,
  CLIENT_CACHE_TAGS.PHASE_TARGETS,
  CLIENT_CACHE_TAGS.LEADERBOARDS,
  CLIENT_CACHE_TAGS.GROUP_ELIGIBILITY,
  CLIENT_CACHE_TAGS.TEAM_TIER_CHANGE
];

export async function createPhase(payload) {
  return postWithInvalidation("/api/phases/create", payload, {
    invalidateTags: PHASE_INVALIDATION_TAGS
  });
}

export async function fetchCurrentPhase() {
  return cachedGet("/api/phases/current", {}, {
    storage: CLIENT_CACHE_STORAGE.MEMORY,
    tags: [CLIENT_CACHE_TAGS.PHASES],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
}

export async function fetchAllPhases() {
  const data = await cachedGet("/api/phases", {}, {
    tags: [CLIENT_CACHE_TAGS.PHASES],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchWorkingDaysPreview(startDate, endDate) {
  return cachedGet("/api/phases/working-days/preview", {
    params: {
      start_date: startDate,
      end_date: endDate
    }
  }, {
    tags: [CLIENT_CACHE_TAGS.PHASES, CLIENT_CACHE_TAGS.HOLIDAYS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
}

export async function fetchPhaseTargets(phaseId) {
  return cachedGet(`/api/phases/${phaseId}/targets`, {}, {
    tags: [CLIENT_CACHE_TAGS.PHASE_TARGETS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
}

export async function setPhaseTargets(phaseId, targets, individualTarget) {
  return postWithInvalidation(`/api/phases/${phaseId}/targets`, {
    targets,
    individual_target: individualTarget
  }, {
    invalidateTags: PHASE_INVALIDATION_TAGS
  });
}

export async function checkPhaseChangeDay(phaseId) {
  return cachedGet(`/api/phases/${phaseId}/is-change-day`, {}, {
    storage: CLIENT_CACHE_STORAGE.MEMORY,
    tags: [CLIENT_CACHE_TAGS.PHASES],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  }); // { isChangeDay, change_day }
}

export async function updatePhaseChangeDay(phaseId, changeDay) {
  return putWithInvalidation(`/api/phases/${phaseId}/change-day`, {
    change_day: changeDay
  }, {
    invalidateTags: PHASE_INVALIDATION_TAGS
  });
}

export async function updatePhaseSettings(phaseId, payload) {
  return putWithInvalidation(`/api/phases/${phaseId}/settings`, payload, {
    invalidateTags: PHASE_INVALIDATION_TAGS
  }); // { message, phase }
}
