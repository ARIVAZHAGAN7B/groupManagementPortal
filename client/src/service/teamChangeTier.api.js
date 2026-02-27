import { api } from "../lib/api";

export async function fetchPhaseTierChangePreview(phaseId) {
  const { data } = await api.get(`/api/team-change-tier/phases/${phaseId}/preview`);
  return data;
}

export async function fetchPhaseWiseTeamChangeTier(phaseId) {
  const { data } = await api.get(`/api/team-change-tier/phases/${phaseId}`);
  return data;
}

export async function applyTeamChangeTier(phaseId, groupId) {
  const { data } = await api.post(`/api/team-change-tier/phases/${phaseId}/groups/${groupId}/apply`);
  return data;
}

