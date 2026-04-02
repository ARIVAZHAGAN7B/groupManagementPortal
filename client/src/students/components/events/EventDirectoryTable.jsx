import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  formatEventCountValue,
  formatEventDate,
  formatEventDurationDays,
  getEventBalanceCount,
  getEventCategoryLabel,
  getEventLocationLabel,
  getEventOrganizerLabel,
  getEventStudentApplyLabel
} from "./events.constants";

const STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
  INACTIVE: "border-rose-200 bg-rose-50 text-rose-700",
  ARCHIVED: "border-amber-200 bg-amber-50 text-amber-700"
};

const headers = [
  "ID",
  "Event Code",
  "Event Name",
  "Event Organizer",
  "Event Category",
  "Status",
  "Start Date",
  "End Date",
  "Duration (Days)",
  "Event Location",
  "Maximum Count",
  "Applied Count",
  "Balance Count",
  "Apply By Student",
  "Actions"
];

function TableText({ className = "", maxWidth = "max-w-[180px]", value }) {
  const label = String(value ?? "").trim() || "-";

  return (
    <p className={`${maxWidth} truncate ${className}`.trim()} title={label}>
      {label}
    </p>
  );
}

function EventCodeBadge({ value }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[9px] text-slate-600">
      {value || "NO-CODE"}
    </span>
  );
}

function StatusBadge({ value }) {
  const normalized = String(value || "").trim().toUpperCase();
  const className = STATUS_STYLES[normalized] || "border-slate-200 bg-slate-100 text-slate-600";
  const label = normalized || "-";

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${className}`}>
      {label.replaceAll("_", " ")}
    </span>
  );
}

export default function EventDirectoryTable({
  rows = [],
  loading = false,
  onView
}) {
  return (
    <div className="overflow-auto rounded-2xl">
      <table className="min-w-[1780px] w-full text-[10px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap px-3.5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12 text-center text-sm text-slate-500">
                Loading events...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12 text-center text-sm text-slate-500">
                No events found for the current filters.
              </td>
            </tr>
          ) : (
            rows.map((event) => {
              const eventId = Number(event.event_id);

              return (
                <tr key={eventId} className="transition hover:bg-slate-50">
                  <td className="px-3.5 py-3.5 whitespace-nowrap font-mono text-[10px] text-slate-500">
                    {eventId}
                  </td>

                  <td className="px-3.5 py-3.5 whitespace-nowrap">
                    <EventCodeBadge value={event.event_code} />
                  </td>

                  <td className="px-3.5 py-3.5">
                    <TableText
                      className="font-semibold text-[11px] text-slate-900"
                      maxWidth="max-w-[240px]"
                      value={event.event_name}
                    />
                  </td>

                  <td className="px-3.5 py-3.5 text-slate-500">
                    <TableText maxWidth="max-w-[200px]" value={getEventOrganizerLabel(event)} />
                  </td>

                  <td className="px-3.5 py-3.5 text-slate-500">
                    <TableText maxWidth="max-w-[170px]" value={getEventCategoryLabel(event)} />
                  </td>

                  <td className="px-3.5 py-3.5 whitespace-nowrap">
                    <StatusBadge value={event.status} />
                  </td>

                  <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                    {formatEventDate(event.start_date)}
                  </td>

                  <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                    {formatEventDate(event.end_date)}
                  </td>

                  <td className="px-3.5 py-3.5 whitespace-nowrap font-semibold text-slate-700">
                    {formatEventDurationDays(event.start_date, event.end_date, event.duration_days)}
                  </td>

                  <td className="px-3.5 py-3.5 text-slate-500">
                    <TableText maxWidth="max-w-[220px]" value={getEventLocationLabel(event)} />
                  </td>

                  <td className="px-3.5 py-3.5 whitespace-nowrap font-semibold text-slate-700">
                    {formatEventCountValue(event.maximum_count)}
                  </td>

                  <td className="px-3.5 py-3.5 whitespace-nowrap font-semibold text-slate-700">
                    {formatEventCountValue(event.applied_count)}
                  </td>

                  <td className="px-3.5 py-3.5 whitespace-nowrap font-semibold text-slate-700">
                    {getEventBalanceCount(event.maximum_count, event.applied_count)}
                  </td>

                  <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                    {getEventStudentApplyLabel(event)}
                  </td>

                  <td className="w-[1%] px-3.5 py-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onView?.(event)}
                      title="View"
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf] transition hover:bg-[#1754cf]/12"
                    >
                      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
