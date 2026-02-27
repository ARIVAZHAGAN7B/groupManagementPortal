import { api } from "../lib/api";

export async function fetchAdminStudentOverview() {
  const { data } = await api.get("/api/eligibility/admin/student-overview");
  return data; // { phase, students }
}

export async function recordStudentBasePoints(payload) {
  const { data } = await api.post("/api/eligibility/base-points", payload);
  return data; // { message, data: { history_id, student_id, total_base_points } }
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
  const { data } = await api.put(
    `/api/eligibility/phases/${phaseId}/individual/${studentId}/override`,
    payload
  );
  return data;
}

export async function overrideGroupEligibility(phaseId, groupId, payload) {
  const { data } = await api.put(
    `/api/eligibility/phases/${phaseId}/group/${groupId}/override`,
    payload
  );
  return data;
}

export async function fetchStudentLeaderboards(params = {}) {
  const { data } = await api.get("/api/eligibility/leaderboards", { params });
  return data; // { limit, individual, leaders, groups }
}

export async function fetchGroupEligibilitySummary(phaseId, groupId) {
  const { data } = await api.get(`/api/eligibility/phases/${phaseId}/groups/${groupId}/summary`);
  return data;
}

export async function fetchMyDashboardSummary() {
  const { data } = await api.get("/api/eligibility/my-dashboard-summary");
  return data;
}

export async function fetchMyEligibilityHistory() {
  const { data } = await api.get("/api/eligibility/individual/me/history");
  return Array.isArray(data) ? data : [];
}
