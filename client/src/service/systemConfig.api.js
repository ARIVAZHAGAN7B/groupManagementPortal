import { api } from "../lib/api";

export async function fetchOperationalPolicy() {
  const { data } = await api.get("/api/system-config/policy");
  return data;
}

export async function updateOperationalPolicy(payload) {
  const { data } = await api.put("/api/system-config/policy", payload);
  return data;
}

export async function fetchIncubationConfig() {
  const { data } = await api.get("/api/system-config/incubation");
  return data;
}

export async function updateIncubationConfig(payload) {
  const { data } = await api.put("/api/system-config/incubation", payload);
  return data;
}

export async function fetchHolidays() {
  const { data } = await api.get("/api/system-config/holidays");
  return Array.isArray(data) ? data : [];
}

export async function fetchHolidayById(holidayId) {
  const { data } = await api.get(`/api/system-config/holidays/${holidayId}`);
  return data;
}

export async function createHoliday(payload) {
  const { data } = await api.post("/api/system-config/holidays", payload);
  return data;
}

export async function updateHoliday(holidayId, payload) {
  const { data } = await api.put(`/api/system-config/holidays/${holidayId}`, payload);
  return data;
}

export async function deleteHoliday(holidayId) {
  const { data } = await api.delete(`/api/system-config/holidays/${holidayId}`);
  return data;
}
