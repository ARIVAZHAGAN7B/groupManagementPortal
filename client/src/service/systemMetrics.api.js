import { api } from "../lib/api";

export async function fetchSystemMetricsSummary() {
  const { data } = await api.get("/api/system-metrics/summary");
  return data || null;
}
