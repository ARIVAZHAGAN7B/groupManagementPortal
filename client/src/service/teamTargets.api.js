import { api } from "../lib/api";

export async function fetchTeamTargets(params = {}) {
  const { data } = await api.get("/api/team-targets", { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchTeamTargetByTeamId(teamId) {
  const { data } = await api.get(`/api/team-targets/${teamId}`);
  return data;
}

export async function setTeamTarget(teamId, payload) {
  const { data } = await api.put(`/api/team-targets/${teamId}`, payload);
  return data;
}
