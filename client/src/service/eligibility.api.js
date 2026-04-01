import {
  api,
  CLIENT_CACHE_TAGS,
  CLIENT_CACHE_STORAGE,
  CLIENT_CACHE_TTL,
  cachedGet,
  postWithInvalidation,
  putWithInvalidation
} from "../lib/api";

const ELIGIBILITY_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.LEADERBOARDS,
  CLIENT_CACHE_TAGS.GROUP_ELIGIBILITY,
  CLIENT_CACHE_TAGS.GROUP_MEMBERSHIPS,
  CLIENT_CACHE_TAGS.GROUP_RANKS
];

export async function fetchAdminStudentOverview() {
  const { data } = await api.get("/api/eligibility/admin/student-overview");
  return data; // { phase, students }
}

export async function recordStudentBasePoints(payload) {
  return postWithInvalidation("/api/eligibility/base-points", payload, {
    invalidateTags: ELIGIBILITY_INVALIDATION_TAGS
  }); // { message, data: { history_id, student_id, total_base_points } }
}

export async function fetchStudentBasePoints(studentId, params = {}) {
  const { data } = await api.get(`/api/eligibility/base-points/${studentId}`, {
    params
  });
  return data; // { summary, history }
}

export async function fetchAdminIndividualEligibility(phaseId, params = {}) {
  const { data } = await api.get(`/api/eligibility/phases/${phaseId}/individual`, {
    params
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchAdminGroupEligibility(phaseId, params = {}) {
  const { data } = await api.get(`/api/eligibility/phases/${phaseId}/group`, {
    params
  });
  return Array.isArray(data) ? data : [];
}

export async function overrideIndividualEligibility(phaseId, studentId, payload) {
  return putWithInvalidation(
    `/api/eligibility/phases/${phaseId}/individual/${studentId}/override`,
    payload,
    {
      invalidateTags: ELIGIBILITY_INVALIDATION_TAGS
    }
  );
}

export async function overrideGroupEligibility(phaseId, groupId, payload) {
  return putWithInvalidation(
    `/api/eligibility/phases/${phaseId}/group/${groupId}/override`,
    payload,
    {
      invalidateTags: ELIGIBILITY_INVALIDATION_TAGS
    }
  );
}

export async function fetchStudentLeaderboards(params = {}) {
  const data = await cachedGet("/api/eligibility/leaderboards", { params }, {
    storage: CLIENT_CACHE_STORAGE.MEMORY,
    tags: [CLIENT_CACHE_TAGS.LEADERBOARDS],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
  return data; // { limit, individual, leaders, groups }
}

export async function fetchGroupEligibilitySummary(phaseId, groupId) {
  return cachedGet(`/api/eligibility/phases/${phaseId}/groups/${groupId}/summary`, {}, {
    storage: CLIENT_CACHE_STORAGE.MEMORY,
    tags: [CLIENT_CACHE_TAGS.GROUP_ELIGIBILITY],
    ttlMs: CLIENT_CACHE_TTL.SHORT
  });
}

export async function fetchMyDashboardSummary() {
  const { data } = await api.get("/api/eligibility/my-dashboard-summary");
  return data;
}

export async function fetchMyEligibilityHistory() {
  const { data } = await api.get("/api/eligibility/individual/me/history");
  return Array.isArray(data) ? data : [];
}
