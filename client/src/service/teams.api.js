import { api } from "../lib/api";

export async function fetchTeams() {
  const { data } = await api.get("/api/teams");
  return Array.isArray(data) ? data : [];
}

export async function fetchTeamsByEvent(eventId) {
  const { data } = await api.get(`/api/teams/event/${eventId}`);
  return Array.isArray(data) ? data : [];
}

export async function fetchTeamById(id) {
  const { data } = await api.get(`/api/teams/${id}`);
  return data;
}

export async function fetchMyTeamMemberships(params = {}) {
  const { data } = await api.get("/api/teams/my-memberships", { params });
  return data; // { student_id, memberships }
}

export async function fetchTeamMemberships(teamId, params = {}) {
  const { data } = await api.get(`/api/teams/${teamId}/memberships`, { params });
  return Array.isArray(data) ? data : [];
}

export async function joinTeam(teamId, payload = {}) {
  const { data } = await api.post(`/api/teams/${teamId}/join`, payload);
  return data;
}

export async function createEventTeam(eventId, payload) {
  const { data } = await api.post(`/api/teams/event/${eventId}`, payload);
  return data; // { message, data: { team, captain_membership } }
}

export async function createTeam(payload) {
  const { data } = await api.post("/api/teams", payload);
  return data;
}

export async function updateTeam(id, payload) {
  const { data } = await api.put(`/api/teams/${id}`, payload);
  return data;
}

export async function activateTeam(id) {
  const { data } = await api.put(`/api/teams/${id}/activate`);
  return data;
}

export async function freezeTeam(id) {
  const { data } = await api.put(`/api/teams/${id}/freeze`);
  return data;
}

export async function archiveTeam(id) {
  const { data } = await api.put(`/api/teams/${id}/archive`);
  return data;
}

export async function deleteTeam(id) {
  const { data } = await api.delete(`/api/teams/${id}`);
  return data;
}
