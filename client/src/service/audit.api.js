import { api } from "../lib/api";

export async function fetchAuditLogs(params = {}) {
  const { data } = await api.get("/api/audit-logs", { params });
  return data; // { page, limit, total, rows }
}
