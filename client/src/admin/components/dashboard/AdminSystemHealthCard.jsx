import React from "react";
import { MiniStat, SectionCard } from "./AdminDashboardPrimitives";
import { count, dateTime, formatPercent } from "./adminDashboard.constants";

export const AdminSystemHealthCard = React.memo(function AdminSystemHealthCard({
  dashboard,
  lastUpdatedAt,
  navigate,
  sourceSummary
}) {
  return (
    <SectionCard
      title="System Health Metrics"
      subtitle="Tracked user/account health plus realtime connection visibility."
      actionLabel="Open audit"
      onAction={() => navigate("/audit-logs")}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MiniStat
          label="Active Users"
          note={`${count(dashboard.systemMetrics?.students?.active)} students | ${count(
            dashboard.systemMetrics?.admins?.active
          )} admins`}
          value={
            dashboard.systemMetrics?.active_users !== null &&
            dashboard.systemMetrics?.active_users !== undefined
              ? count(dashboard.systemMetrics.active_users)
              : "N/A"
          }
        />
        <MiniStat
          label="Live Connections"
          note={`${count(
            dashboard.systemMetrics?.realtime?.admin_connections
          )} admin sockets connected`}
          value={
            dashboard.systemMetrics?.realtime?.authenticated_connections !== null &&
            dashboard.systemMetrics?.realtime?.authenticated_connections !== undefined
              ? count(dashboard.systemMetrics.realtime.authenticated_connections)
              : "N/A"
          }
        />
        <MiniStat
          label="Data Sources"
          note={sourceSummary?.failed?.length ? sourceSummary.failed.join(", ") : "All tracked sources loaded."}
          value={`${count(sourceSummary?.loaded)}/${count(sourceSummary?.total)}`}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniStat
          label="API Usage / Hour"
          note="Requires backend request telemetry."
          value={
            dashboard.systemMetrics?.telemetry?.api_usage_per_hour == null
              ? "Not tracked"
              : count(dashboard.systemMetrics?.telemetry?.api_usage_per_hour)
          }
        />
        <MiniStat
          label="Error Rate"
          note="Requires failed-operation instrumentation."
          value={
            dashboard.systemMetrics?.telemetry?.error_rate == null
              ? "Not tracked"
              : formatPercent(dashboard.systemMetrics?.telemetry?.error_rate, 1)
          }
        />
        <MiniStat
          label="Failed Operations"
          note={dashboard.systemMetrics?.telemetry?.instrumentation_note || "Telemetry status"}
          value={
            dashboard.systemMetrics?.telemetry?.failed_operations == null
              ? "Not tracked"
              : count(dashboard.systemMetrics?.telemetry?.failed_operations)
          }
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniStat
          label="Last Updated"
          note="Dashboard refresh timestamp."
          value={lastUpdatedAt ? dateTime(lastUpdatedAt) : "Pending refresh"}
        />
        <MiniStat
          label="Pending Reviews"
          note="Leadership, tier, and on-duty queues combined."
          value={count(
            dashboard.pendingLeadership + dashboard.pendingTier + dashboard.pendingOd
          )}
        />
        <MiniStat
          label="Telemetry Note"
          note="Current backend coverage."
          value={
            dashboard.systemMetrics
              ? dashboard.systemMetrics?.telemetry?.instrumentation_note
                ? "Partial"
                : "Live"
              : "Unavailable"
          }
        />
      </div>
    </SectionCard>
  );
});
