import { api } from "../lib/api";

export async function fetchTeams(params = {}) {
  const { data } = await api.get("/api/teams", { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchTeamsByEvent(eventId, params = {}) {
  const { data } = await api.get(`/api/teams/event/${eventId}`, { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchEventGroups(params = {}) {
  const merged = { team_type: "EVENT", ...params };
  const { data } = await api.get("/api/event-groups", { params: merged });
  return Array.isArray(data) ? data : [];
}

export async function fetchEventGroupsByEvent(eventId, params = {}) {
  const merged = { team_type: "EVENT", ...params };
  const { data } = await api.get(`/api/event-groups/event/${eventId}`, { params: merged });
  return Array.isArray(data) ? data : [];
}

export async function fetchTeamById(id) {
  const { data } = await api.get(`/api/teams/${id}`);
  return data;
}

export async function fetchEventGroupById(id) {
  const { data } = await api.get(`/api/event-groups/${id}`);
  return data;
}

export async function fetchMyTeamMemberships(params = {}) {
  const { data } = await api.get("/api/teams/my-memberships", { params });
  return data; // { student_id, memberships }
}

export async function fetchAllTeamMemberships(params = {}) {
  const { data } = await api.get("/api/teams/memberships", { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchMyEventGroupMemberships(params = {}) {
  const merged = { team_type: "EVENT", ...params };
  const { data } = await api.get("/api/event-groups/my-memberships", { params: merged });
  return data;
}

export async function fetchTeamMemberships(teamId, params = {}) {
  const { data } = await api.get(`/api/teams/${teamId}/memberships`, { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchEventGroupMemberships(teamId, params = {}) {
  const { data } = await api.get(`/api/event-groups/${teamId}/memberships`, { params });
  return Array.isArray(data) ? data : [];
}

export async function joinTeam(teamId, payload = {}) {
  const { data } = await api.post(`/api/teams/${teamId}/join`, payload);
  return data;
}

export async function addTeamMember(teamId, payload) {
  const { data } = await api.post(`/api/teams/${teamId}/memberships`, payload);
  return data;
}

export async function createEventTeam(eventId, payload) {
  const { data } = await api.post(`/api/event-groups/event/${eventId}`, payload);
  return data; // { message, data: { team, captain_membership } }
}

export async function createEventGroup(eventId, payload) {
  return createEventTeam(eventId, payload);
}

export async function createTeam(payload) {
  const { data } = await api.post("/api/teams", payload);
  return data;
}

export async function updateEventGroup(id, payload) {
  const { data } = await api.put(`/api/event-groups/${id}`, payload);
  return data;
}

export async function updateTeam(id, payload) {
  const { data } = await api.put(`/api/teams/${id}`, payload);
  return data;
}

export async function updateTeamMembership(membershipId, payload) {
  const { data } = await api.put(`/api/teams/memberships/${membershipId}`, payload);
  return data;
}

export async function activateTeam(id) {
  const { data } = await api.put(`/api/teams/${id}/activate`);
  return data;
}

export async function activateEventGroup(id) {
  const { data } = await api.put(`/api/event-groups/${id}/activate`);
  return data;
}

export async function freezeTeam(id) {
  const { data } = await api.put(`/api/teams/${id}/freeze`);
  return data;
}

export async function freezeEventGroup(id) {
  const { data } = await api.put(`/api/event-groups/${id}/freeze`);
  return data;
}

export async function archiveTeam(id) {
  const { data } = await api.put(`/api/teams/${id}/archive`);
  return data;
}

export async function archiveEventGroup(id) {
  const { data } = await api.put(`/api/event-groups/${id}/archive`);
  return data;
}

export async function deleteTeam(id) {
  const { data } = await api.delete(`/api/teams/${id}`);
  return data;
}

export async function leaveTeamMembership(membershipId, payload = {}) {
  const { data } = await api.delete(`/api/teams/memberships/${membershipId}`, { data: payload });
  return data;
}

export async function deleteEventGroup(id) {
  const { data } = await api.delete(`/api/event-groups/${id}`);
  return data;
}
