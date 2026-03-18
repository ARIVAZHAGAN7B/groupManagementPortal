import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import { formatLabel } from "../teams/teamPage.utils";
import {
  getEventDateRangeLabel,
  getEventLocationLabel,
  getEventMemberLimitLabel,
  getEventRegistrationDateRangeLabel
} from "./events.constants";

export default function EventDirectoryTable({
  rows = [],
  loading = false,
  onView
}) {
  return (
    <div className="overflow-x-auto overflow-y-visible rounded-2xl">
      <table className="min-w-[1120px] w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Event</th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Location</th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Event Dates</th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Registration</th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Members</th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Groups</th>
            <th className="sticky right-0 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.14)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {loading ? (
            <tr>
              <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={8}>
                Loading events...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={8}>
                No events found for the current filters.
              </td>
            </tr>
          ) : (
            rows.map((event) => (
              <tr key={event.event_id} className="group hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{event.event_name || "-"}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {event.event_code || "No code"}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{getEventLocationLabel(event)}</td>
                <td className="px-4 py-3 text-slate-700">{getEventDateRangeLabel(event)}</td>
                <td className="px-4 py-3 text-slate-700">
                  {getEventRegistrationDateRangeLabel(event)}
                </td>
                <td className="px-4 py-3 text-slate-700">{getEventMemberLimitLabel(event)}</td>
                <td className="px-4 py-3">
                  <AllGroupsBadge value={formatLabel(event.status, "Unknown")} />
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {Number(event.team_count) || 0}
                </td>
                <td className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-slate-50/80">
                  <button
                    type="button"
                    onClick={() => onView?.(event)}
                    title={`View ${event.event_name || "event"}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf] transition hover:bg-[#1754cf]/12"
                  >
                    <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
