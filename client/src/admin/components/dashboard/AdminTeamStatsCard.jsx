import React from "react";
import { MiniStat, SectionCard, StatusBadge } from "./AdminDashboardPrimitives";
import { count, formatAverage, formatPercent, num } from "./adminDashboard.constants";

export const AdminTeamStatsCard = React.memo(function AdminTeamStatsCard({
  dashboard,
  data,
  navigate
}) {
  return (
    <SectionCard
      title="Team Statistics"
      subtitle="Team status, roster balance, and participation readiness."
      actionLabel="Open teams"
      onAction={() => navigate("/team-management")}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MiniStat label="Total Teams" note="Regular teams only." value={count(data.teams.length)} />
        <MiniStat
          label="Avg Members"
          note={`${count(
            dashboard.topTeamsByMembers.filter((row) => num(row.active_member_count) > 0).length
          )} top teams have active rosters`}
          value={formatAverage(dashboard.avgMembersPerTeam)}
        />
        <MiniStat
          label="Populated Teams"
          note="Teams with at least one active member."
          value={formatPercent(
            data.teams.length ? dashboard.populatedTeams / data.teams.length : null
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge label="Active" statusKey="ACTIVE" value={dashboard.teamStatusCounts.ACTIVE} />
        <StatusBadge
          label="Inactive"
          statusKey="INACTIVE"
          value={dashboard.teamStatusCounts.INACTIVE}
        />
        <StatusBadge label="Frozen" statusKey="FROZEN" value={dashboard.teamStatusCounts.FROZEN} />
        <StatusBadge
          label="Archived"
          statusKey="ARCHIVED"
          value={dashboard.teamStatusCounts.ARCHIVED}
        />
      </div>

      <div className="mt-4">
        <MiniStat
          label="Teams with Members"
          note="Teams containing active members."
          value={count(
            dashboard.topTeamsByMembers.filter((row) => num(row.active_member_count) > 0).length
          )}
        />
      </div>
    </SectionCard>
  );
});
