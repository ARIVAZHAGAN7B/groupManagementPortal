import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import { formatLabel } from "../teams/teamPage.utils";
import {
  getEventAllowedHubSummary,
  getEventHubRestrictionLabel,
  getEventCategoryLabel,
  getEventDateRangeLabel,
  getEventLevelLabel,
  getEventLocationLabel,
  getEventOrganizerLabel,
  getEventRegistrationModeLabel,
  getEventRegistrationDateRangeLabel,
  getEventRegistrationFilterValue,
  getEventStudentApplyLabel
} from "./events.constants";

export default function EventDirectoryMobileCards({
  rows = [],
  loading = false,
  onView
}) {
  if (loading) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500">Loading events...</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-slate-500">
        No events found for the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 lg:hidden">
      {rows.map((event) => (
        <article key={event.event_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600">
              {event.event_code || "NO-CODE"}
            </span>
            <AllGroupsBadge value={formatLabel(event.status, "Unknown")} />
            <AllGroupsBadge value={formatLabel(getEventRegistrationFilterValue(event), "Open")} />
            <AllGroupsBadge value={getEventStudentApplyLabel(event)} />
            <AllGroupsBadge value={getEventHubRestrictionLabel(event)} />
          </div>

          <div className="mt-3 min-w-0">
            <h2 className="truncate text-base font-bold text-slate-900">
              {event.event_name || "-"}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-500">{getEventOrganizerLabel(event)}</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TeamPageDetailTile label="Category" value={getEventCategoryLabel(event)} />
            <TeamPageDetailTile label="Level" value={getEventLevelLabel(event)} />
            <TeamPageDetailTile label="Location" value={getEventLocationLabel(event)} />
            <TeamPageDetailTile
              label="Registration Mode"
              value={getEventRegistrationModeLabel(event)}
            />
            <TeamPageDetailTile label="Student Registration" value={getEventStudentApplyLabel(event)} />
            <TeamPageDetailTile
              label="Event Dates"
              value={getEventDateRangeLabel(event)}
            />
            <TeamPageDetailTile
              label="Registration"
              value={getEventRegistrationDateRangeLabel(event)}
              subtext={formatLabel(getEventRegistrationFilterValue(event), "Open")}
            />
            <TeamPageDetailTile
              label="Hub Access"
              value={getEventHubRestrictionLabel(event)}
              subtext={getEventAllowedHubSummary(event)}
            />
            <TeamPageDetailTile
              label="Entries"
              value={Number(event.team_count) || 0}
              subtext="Registered entries"
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onView?.(event)}
              title={`Open ${event.event_name || "event"} listing`}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3.5 py-2.5 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12"
            >
              <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
              View Listing
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
