import React from "react";
import { BarRow, MiniStat, SectionCard, StatusBadge } from "./AdminDashboardPrimitives";
import {
  BAR_TONES,
  count,
  formatAverage,
  formatPercent,
  isTrue,
  safeArray,
  upper
} from "./adminDashboard.constants";

export const AdminGroupStatsCard = React.memo(function AdminGroupStatsCard({
  dashboard,
  data,
  navigate
}) {
  return (
    <SectionCard
      title="Group Statistics"
      subtitle="Status mix, tiers, and roster concentration across groups."
      actionLabel="Open groups"
      onAction={() => navigate("/groups")}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MiniStat
          label="Total Groups"
          note="All group records in the system."
          value={count(data.groups.length)}
        />
        <MiniStat
          label="Applications Open"
          note="Groups currently accepting applications."
          value={count(
            safeArray(data.groups).filter(
              (row) =>
                isTrue(row?.accepting_applications) &&
                !["INACTIVE", "ARCHIVED"].includes(upper(row?.status))
            ).length
          )}
        />
        <MiniStat
          label="Avg Students / Active Group"
          note={`${count(dashboard.groupedStudents)} assigned students`}
          value={formatAverage(dashboard.avgStudentsPerActiveGroup)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge label="Active" statusKey="ACTIVE" value={dashboard.groupStatusCounts.ACTIVE} />
        <StatusBadge
          label="Inactive"
          statusKey="INACTIVE"
          value={dashboard.groupStatusCounts.INACTIVE}
        />
        <StatusBadge label="Frozen" statusKey="FROZEN" value={dashboard.groupStatusCounts.FROZEN} />
        <StatusBadge
          label="Archived"
          statusKey="ARCHIVED"
          value={dashboard.groupStatusCounts.ARCHIVED}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          {dashboard.groupTierDistribution.map((row, index) => (
            <BarRow
              key={row.label}
              label={row.label}
              note={`${formatPercent(
                data.groups.length ? row.value / data.groups.length : null
              )} of total groups`}
              tone={BAR_TONES[index % BAR_TONES.length]}
              total={data.groups.length}
              value={row.value}
            />
          ))}
        </div>

        <div className="mt-4">
          <MiniStat
            label="Groups with Members"
            note="Groups containing active members."
            value={count(dashboard.largestGroupsByMembers.length)}
          />
        </div>
      </div>
    </SectionCard>
  );
});
