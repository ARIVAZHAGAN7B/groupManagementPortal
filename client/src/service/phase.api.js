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
