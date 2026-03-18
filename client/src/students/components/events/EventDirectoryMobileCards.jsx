import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import { formatLabel } from "../teams/teamPage.utils";
import {
  getEventDateRangeLabel,
  getEventLocationLabel,
  getEventMemberLimitLabel,
  getEventRegistrationDateRangeLabel
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
        <article
          key={event.event_id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-900">
                {event.event_name || "-"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">{event.event_code || "No code"}</p>
            </div>
            <AllGroupsBadge value={formatLabel(event.status, "Unknown")} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TeamPageDetailTile label="Location" value={getEventLocationLabel(event)} />
            <TeamPageDetailTile
              label="Groups"
              value={Number(event.team_count) || 0}
              subtext="Registered event groups"
            />
            <TeamPageDetailTile label="Event Dates" value={getEventDateRangeLabel(event)} />
            <TeamPageDetailTile
              label="Registration"
              value={getEventRegistrationDateRangeLabel(event)}
            />
            <TeamPageDetailTile label="Members" value={getEventMemberLimitLabel(event)} />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onView?.(event)}
              title={`View ${event.event_name || "event"}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf] transition hover:bg-[#1754cf]/12"
            >
              <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
