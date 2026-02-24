import { api } from "../lib/api";

export async function fetchEvents() {
  const { data } = await api.get("/api/events");
  return Array.isArray(data) ? data : [];
}

export async function fetchEventById(id) {
  const { data } = await api.get(`/api/events/${id}`);
  return data;
}

export async function createEvent(payload) {
  const { data } = await api.post("/api/events", payload);
  return data;
}

export async function updateEvent(id, payload) {
  const { data } = await api.put(`/api/events/${id}`, payload);
  return data;
}

export async function activateEvent(id) {
  const { data } = await api.put(`/api/events/${id}/activate`);
  return data;
}

export async function closeEvent(id) {
  const { data } = await api.put(`/api/events/${id}/close`);
  return data;
}

export async function archiveEvent(id) {
  const { data } = await api.put(`/api/events/${id}/archive`);
  return data;
}

export async function deleteEvent(id) {
  const { data } = await api.delete(`/api/events/${id}`);
  return data;
}
