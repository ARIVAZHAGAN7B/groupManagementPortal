import React from "react";
import {
  EmptyState,
  GrowthBlock,
  InsightRow,
  MiniStat,
  SectionCard
} from "./AdminDashboardPrimitives";
import { count, formatPercent } from "./adminDashboard.constants";

export const AdminOperationalAlerts = React.memo(function AdminOperationalAlerts({
  dashboard,
  data,
  navigate
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <SectionCard
        title="Alerts & Flags"
        subtitle="Operational signals that need follow-up."
        className="xl:col-span-1"
      >
        {dashboard.alerts.length > 0 ? (
          <div className="space-y-3">
            {dashboard.alerts.slice(0, 8).map((item) => (
              <InsightRow
                key={item.title}
                badge={item.badge}
                badgeTone={item.badgeTone}
                meta={item.meta}
                onClick={() => navigate(item.route)}
                title={item.title}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No high-priority alerts are active right now." />
        )}
      </SectionCard>

      <SectionCard
        title="Growth Snapshot"
        subtitle="Rolling 24h, 7d, and 30d creation trends across services."
        className="xl:col-span-1"
      >
        <div className="space-y-3">
          <GrowthBlock counts={dashboard.studentGrowth} label="Students" />
          <GrowthBlock counts={dashboard.groupGrowth} label="Groups" />
          <GrowthBlock counts={dashboard.teamGrowth} label="Teams" />
          <GrowthBlock counts={dashboard.eventGrowth} label="Events" />
        </div>
      </SectionCard>

      <SectionCard
        title="Engagement Snapshot"
        subtitle="Participation, activity, and performance indicators."
        className="xl:col-span-1"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          <MiniStat
            label="Event Participation"
            note={`${count(dashboard.totalEventRegistrations)} registrations across capped events`}
            value={formatPercent(dashboard.participationRate)}
          />
          <MiniStat
            label="Group Activity"
            note={`${count(dashboard.groupsWithMembers)} groups have active members`}
            value={formatPercent(
              data.groups.length ? dashboard.groupsWithMembers / data.groups.length : null
            )}
          />
          <MiniStat
            label="Populated Teams"
            note="Teams with at least one active member."
            value={formatPercent(
              data.teams.length ? dashboard.populatedTeams / data.teams.length : null
            )}
          />
          <MiniStat
            label="Advanced Event Groups"
            note="Event groups progressing beyond round zero."
            value={formatPercent(
              data.eventGroups.length
                ? dashboard.progressedEventGroups / data.eventGroups.length
                : null
            )}
          />
        </div>

        <div className="mt-4">
          <MiniStat
            label="Active Groups"
            note="Groups with current membership and activity."
            value={count(dashboard.topGroupsByActivity.length)}
          />
        </div>
      </SectionCard>
    </div>
  );
});
