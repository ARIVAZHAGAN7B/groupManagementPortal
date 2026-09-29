import React from "react";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import StackedBarChartRoundedIcon from "@mui/icons-material/StackedBarChartRounded";
import WidgetsRoundedIcon from "@mui/icons-material/WidgetsRounded";
import { SummaryTile } from "./AdminDashboardPrimitives";
import { compact, count, formatAverage, formatPercent } from "./adminDashboard.constants";

export const AdminSummaryTiles = React.memo(function AdminSummaryTiles({
  dashboard,
  data,
  navigate,
  phase,
  sourceSummary
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryTile
        accent="#1754cf"
        icon={Groups2RoundedIcon}
        label="Groups"
        note={`${count(dashboard.groupStatusCounts.ACTIVE)} active | ${count(
          dashboard.groupStatusCounts.FROZEN
        )} frozen`}
        onClick={() => navigate("/groups")}
        value={compact(data.groups.length)}
      />
      <SummaryTile
        accent="#0ea5e9"
        icon={AccountTreeRoundedIcon}
        label="Phases"
        note={phase?.phase_name ? dashboard.groupEligibilityLabel : `${count(data.phases.length)} total phases`}
        onClick={() => navigate("/phase-history")}
        value={compact(data.phases.length)}
      />
      <SummaryTile
        accent="#10b981"
        icon={StackedBarChartRoundedIcon}
        label="Teams"
        note={`${count(dashboard.teamStatusCounts.ACTIVE)} active | avg ${formatAverage(
          dashboard.avgMembersPerTeam
        )} members`}
        onClick={() => navigate("/team-management")}
        value={compact(data.teams.length)}
      />
      <SummaryTile
        accent="#14b8a6"
        icon={HubRoundedIcon}
        label="Hubs"
        note={`${count(dashboard.hubStatusCounts.ACTIVE)} active | avg ${formatAverage(
          dashboard.avgMembersPerHub
        )} members`}
        onClick={() => navigate("/hub-management")}
        value={compact(data.hubs.length)}
      />
      <SummaryTile
        accent="#f97316"
        icon={EmojiEventsRoundedIcon}
        label="Events"
        note={`${count(dashboard.openEvents.length)} registration open | ${formatPercent(
          dashboard.participationRate
        )} participation`}
        onClick={() => navigate("/event-management")}
        value={compact(data.events.length)}
      />
      <SummaryTile
        accent="#8b5cf6"
        icon={WidgetsRoundedIcon}
        label="Event Groups"
        note={`${count(dashboard.eventGroupStatusCounts.ACTIVE)} active | ${count(
          dashboard.progressedEventGroups
        )} advanced`}
        onClick={() => navigate("/event-group-management")}
        value={compact(data.eventGroups.length)}
      />
      <SummaryTile
        accent="#ef4444"
        icon={SchoolRoundedIcon}
        label="Students"
        note={`${count(dashboard.studentStatusCounts.ACTIVE)} active | ${count(
          dashboard.ungroupedStudents
        )} ungrouped`}
        onClick={() => navigate("/student-management")}
        value={compact(data.students.length)}
      />
      <SummaryTile
        accent="#0f172a"
        icon={MonitorHeartRoundedIcon}
        label="System Health"
        note={`${count(sourceSummary?.loaded)}/${count(sourceSummary?.total)} sources live | ${
          dashboard.systemMetrics?.telemetry?.api_usage_per_hour == null
            ? "API telemetry pending"
            : "API telemetry live"
        }`}
        onClick={() => navigate("/audit-logs")}
        value={
          dashboard.systemMetrics?.active_users !== null &&
          dashboard.systemMetrics?.active_users !== undefined
            ? compact(dashboard.systemMetrics.active_users)
            : "N/A"
        }
      />
    </div>
  );
});
