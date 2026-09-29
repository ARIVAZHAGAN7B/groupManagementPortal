const repo = require("./systemMetrics.repository");
const { getRealtimeSummary } = require("../../realtime/socket");
const db = require("../../config/db");

const upper = (value) => String(value || "").trim().toUpperCase();
const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getEmptyRoleCounts = () => ({
  total: 0,
  active: 0,
  inactive: 0
});

const getSystemMetricsSummary = async () => {
  const rows = await repo.getUserStatusCounts();

  const summary = {
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    students: getEmptyRoleCounts(),
    admins: getEmptyRoleCounts(),
    realtime: {
      authenticated_connections: 0,
      admin_connections: 0
    },
    telemetry: {
      api_usage_per_hour: null,
      error_rate: null,
      failed_operations: null,
      instrumentation_note: "API usage and error telemetry are not instrumented by the backend."
    }
  };

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const total = num(row?.total);
    const role = upper(row?.role);
    const status = upper(row?.status);

    summary.total_users += total;

    if (status === "ACTIVE") {
      summary.active_users += total;
    } else if (status === "INACTIVE") {
      summary.inactive_users += total;
    }

    if (role === "STUDENT") {
      summary.students.total += total;
      if (status === "ACTIVE") summary.students.active += total;
      if (status === "INACTIVE") summary.students.inactive += total;
      return;
    }

    if (role === "ADMIN" || role === "SYSTEM_ADMIN") {
      summary.admins.total += total;
      if (status === "ACTIVE") summary.admins.active += total;
      if (status === "INACTIVE") summary.admins.inactive += total;
    }
  });

  summary.realtime = getRealtimeSummary();
  summary.database_pool = typeof db?.getPoolMetrics === "function" ? db.getPoolMetrics() : null;

  return summary;
};

module.exports = {
  getSystemMetricsSummary
};
