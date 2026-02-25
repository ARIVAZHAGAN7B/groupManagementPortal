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
