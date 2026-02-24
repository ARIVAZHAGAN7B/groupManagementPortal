import { api } from "../lib/api";

export async function fetchGroups() {
  const { data } = await api.get("/api/groups");
  return data;
}

export async function fetchGroupById(id) {
  const { data } = await api.get(`/api/groups/${id}`);
  return data;
}

export async function createGroup(payload) {
  const { data } = await api.post("/api/groups", payload);
  return data; // { message, id }
}

export async function updateGroup(id, payload) {
  const { data } = await api.put(`/api/groups/${id}`, payload);
  return data;
}

export async function activateGroup(id) {
  const { data } = await api.put(`/api/groups/${id}/activate`);
  return data;
}

export async function freezeGroup(id) {
  const { data } = await api.put(`/api/groups/${id}/freeze`);
  return data;
}

export async function deleteGroup(id) {
  const { data } = await api.delete(`/api/groups/${id}`);
  return data;
}
