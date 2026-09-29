import React from "react";
import { GrowthBlock, MiniStat, SectionCard, StatusBadge } from "./AdminDashboardPrimitives";
import { count, formatAverage } from "./adminDashboard.constants";

export const AdminHubStatsCard = React.memo(function AdminHubStatsCard({
  dashboard,
  data,
  navigate
}) {
  return (
    <SectionCard
      title="Hub Statistics"
      subtitle="Hub status, roster health, and creation growth."
      actionLabel="Open hubs"
      onAction={() => navigate("/hub-management")}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MiniStat label="Total Hubs" note="All hub records." value={count(data.hubs.length)} />
        <MiniStat
          label="Avg Members"
          note="Average active members per hub."
          value={formatAverage(dashboard.avgMembersPerHub)}
        />
        <MiniStat
          label="New Hubs"
          note="Growth is shown in the 30d snapshot below."
          value={count(dashboard.hubGrowth.month)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge label="Active" statusKey="ACTIVE" value={dashboard.hubStatusCounts.ACTIVE} />
        <StatusBadge
          label="Inactive"
          statusKey="INACTIVE"
          value={dashboard.hubStatusCounts.INACTIVE}
        />
        <StatusBadge label="Frozen" statusKey="FROZEN" value={dashboard.hubStatusCounts.FROZEN} />
        <StatusBadge
          label="Archived"
          statusKey="ARCHIVED"
          value={dashboard.hubStatusCounts.ARCHIVED}
        />
      </div>

      <div className="mt-5">
        <GrowthBlock counts={dashboard.hubGrowth} label="Hub creation trend" />
      </div>
    </SectionCard>
  );
});
