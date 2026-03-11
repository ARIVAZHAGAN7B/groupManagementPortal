import { api } from "../lib/api";

export async function createPhase(payload) {
  const { data } = await api.post("/api/phases/create", payload);
  return data;
}

export async function fetchCurrentPhase() {
  const { data } = await api.get("/api/phases/current");
  return data;
}

export async function fetchAllPhases() {
  const { data } = await api.get("/api/phases");
  return Array.isArray(data) ? data : [];
}

export async function fetchWorkingDaysPreview(startDate, endDate) {
  const { data } = await api.get("/api/phases/working-days/preview", {
    params: {
      start_date: startDate,
      end_date: endDate
    }
  });
  return data;
}

export async function fetchPhaseTargets(phaseId) {
  const { data } = await api.get(`/api/phases/${phaseId}/targets`);
  return data;
}

export async function setPhaseTargets(phaseId, targets, individualTarget) {
  const { data } = await api.post(`/api/phases/${phaseId}/targets`, {
    targets,
    individual_target: individualTarget
  });
  return data;
}

export async function checkPhaseChangeDay(phaseId) {
  const { data } = await api.get(`/api/phases/${phaseId}/is-change-day`);
  return data; // { isChangeDay, change_day }
}

export async function updatePhaseChangeDay(phaseId, changeDay) {
  const { data } = await api.put(`/api/phases/${phaseId}/change-day`, {
    change_day: changeDay
  });
  return data; // { message, phase }
}

export async function updatePhaseSettings(phaseId, payload) {
  const { data } = await api.put(`/api/phases/${phaseId}/settings`, payload);
  return data; // { message, phase }
}
