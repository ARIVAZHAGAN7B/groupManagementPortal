import React from "react";
import {
  EmptyState,
  InsightRow,
  MiniStat,
  SectionCard,
  StatusBadge
} from "./AdminDashboardPrimitives";
import { count, formatAverage } from "./adminDashboard.constants";

export const AdminEventGroupStatsCard = React.memo(function AdminEventGroupStatsCard({
  dashboard,
  data,
  navigate
}) {
  return (
    <SectionCard
      title="Event Group Statistics"
      subtitle="Event-linked teams, status health, and per-event grouping."
      actionLabel="Open event groups"
      onAction={() => navigate("/event-group-management")}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MiniStat
          label="Total Event Groups"
          note="All event-linked team records."
          value={count(data.eventGroups.length)}
        />
        <MiniStat
          label="Active Event Groups"
          note="Currently active event group records."
          value={count(dashboard.eventGroupStatusCounts.ACTIVE)}
        />
        <MiniStat
          label="Advanced Groups"
          note="Event groups with rounds cleared greater than zero."
          value={count(dashboard.progressedEventGroups)}
        />
        <MiniStat
          label="Avg Groups / Event"
          note="Average distribution of event groups."
          value={formatAverage(dashboard.avgEventGroupsPerEvent)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge
          label="Active"
          statusKey="ACTIVE"
          value={dashboard.eventGroupStatusCounts.ACTIVE}
        />
        <StatusBadge
          label="Inactive"
          statusKey="INACTIVE"
          value={dashboard.eventGroupStatusCounts.INACTIVE}
        />
        <StatusBadge
          label="Frozen"
          statusKey="FROZEN"
          value={dashboard.eventGroupStatusCounts.FROZEN}
        />
        <StatusBadge
          label="Archived"
          statusKey="ARCHIVED"
          value={dashboard.eventGroupStatusCounts.ARCHIVED}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          {dashboard.groupsPerEvent.length > 0 ? (
            dashboard.groupsPerEvent.map((row) => (
              <InsightRow
                key={`${row.eventId || row.eventName}`}
                badge={`${count(row.count)} groups`}
                badgeTone="bg-violet-600"
                meta={`${count(row.members)} active members across mapped event groups`}
                onClick={row.eventId ? () => navigate(`/event-management/${row.eventId}`) : undefined}
                title={row.eventName}
              />
            ))
          ) : (
            <EmptyState message="No event-group mappings are available right now." />
          )}
        </div>

        <div className="mt-4">
          <MiniStat
            label="Event Groups with Progress"
            note="Event groups with cleared rounds."
            value={count(dashboard.progressedEventGroups)}
          />
        </div>
      </div>
    </SectionCard>
  );
});
