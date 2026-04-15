import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  STATUS_STYLES,
  formatBooleanLabel,
  formatCountValue,
  formatDate,
  formatDurationDays,
  getBalanceCount,
  getVisibleEventStatusActions
} from "./eventManagement.constants";
import {
  AdminBadge,
  AdminIconActionButton,
  AdminMappedBadge,
  AdminTextActionButton
} from "../ui/AdminUiPrimitives";

const headers = [
  "ID",
  "Event Code",
  "Event Name",
  "Host / Organizer",
  "Event Category",
  "Status",
  "Start Date",
  "End Date",
  "Duration (Days)",
  "Event Location",
  "Maximum Count",
  "Valid Registrations",
  "Available Slots",
  "Registration Mode",
  "Student Registration",
  "Actions"
];

function TableText({
  className = "",
  maxWidth = "max-w-[180px]",
  value
}) {
  const label = String(value ?? "").trim() || "-";

  return (
    <p className={`${maxWidth} truncate ${className}`.trim()} title={label}>
      {label}
    </p>
  );
}

export default function EventManagementDesktopTable({
  actionBusyId,
  onActivate,
  onArchive,
  onClose,
  onEdit,
  onView,
  rows
}) {
  return (
    <div className="hidden overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <table className="min-w-[1780px] w-full text-[11px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap px-3.5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const eventId = Number(row.event_id);
            const busy = actionBusyId === eventId;
            const visibleActions = getVisibleEventStatusActions(row.status);

            return (
              <tr key={eventId} className="transition hover:bg-slate-50">
                <td className="px-3.5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                  {eventId}
                </td>

                <td className="px-3.5 py-3.5 whitespace-nowrap">
                  <AdminBadge className="border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                    {row.event_code || "NO-CODE"}
                  </AdminBadge>
                </td>

                <td className="px-3.5 py-3.5">
                  <TableText
                    className="font-semibold text-[12px] text-slate-900"
                    maxWidth="max-w-[240px]"
                    value={row.event_name}
                  />
                </td>

                <td className="px-3.5 py-3.5 text-slate-500">
                  <TableText maxWidth="max-w-[200px]" value={row.event_organizer} />
                </td>

                <td className="px-3.5 py-3.5 text-slate-500">
                  <TableText maxWidth="max-w-[170px]" value={row.event_category} />
                </td>

                <td className="px-3.5 py-3.5 whitespace-nowrap">
                  <AdminMappedBadge
                    className="px-2 py-0.5 text-[10px]"
                    map={STATUS_STYLES}
                    value={row.status}
                  />
                </td>

                <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                  {formatDate(row.start_date)}
                </td>

                <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                  {formatDate(row.end_date)}
                </td>

                <td className="px-3.5 py-3.5 whitespace-nowrap font-semibold text-slate-700">
                  {formatDurationDays(row.start_date, row.end_date, row.duration_days)}
                </td>

                <td className="px-3.5 py-3.5 text-slate-500">
                  <TableText maxWidth="max-w-[220px]" value={row.location} />
                </td>

                <td className="px-3.5 py-3.5 whitespace-nowrap font-semibold text-slate-700">
                  {formatCountValue(row.maximum_count)}
                </td>

                <td className="px-3.5 py-3.5 whitespace-nowrap font-semibold text-slate-700">
                  {formatCountValue(row.applied_count)}
                </td>

                <td className="px-3.5 py-3.5 whitespace-nowrap font-semibold text-slate-700">
                  {getBalanceCount(row.maximum_count, row.applied_count)}
                </td>

                <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                  {String(row.registration_mode || "TEAM").toUpperCase() === "INDIVIDUAL"
                    ? "Individual"
                    : "Team"}
                </td>

                <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                  {formatBooleanLabel(row.apply_by_student)}
                </td>

                <td className="w-[1%] px-3.5 py-3.5 whitespace-nowrap">
                  <div className="inline-grid grid-flow-col auto-cols-max items-center gap-1">
                    <AdminIconActionButton
                      onClick={() => onView(row)}
                      label="View"
                      sizeClassName="h-7 w-7"
                      baseClassName="rounded-md border border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf]"
                      className="hover:bg-[#1754cf]/12"
                    >
                      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    </AdminIconActionButton>

                    <AdminIconActionButton
                      onClick={() => onEdit(row)}
                      disabled={busy}
                      label="Edit"
                      sizeClassName="h-7 w-7"
                      baseClassName="rounded-md border border-slate-200 bg-white text-slate-700"
                      className="hover:bg-slate-50"
                    >
                      <EditOutlinedIcon sx={{ fontSize: 18 }} />
                    </AdminIconActionButton>

                    {visibleActions.activate ? (
                      <AdminTextActionButton
                        onClick={() => onActivate(row)}
                        disabled={busy}
                        label="Activate"
                        fullWidth={false}
                        sizeClassName="px-2 py-1"
                        textClassName="text-[11px] font-semibold leading-none"
                        className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      />
                    ) : null}

                    {visibleActions.close ? (
                      <AdminIconActionButton
                        onClick={() => onClose(row)}
                        disabled={busy}
                        label="Close"
                        sizeClassName="h-7 w-7"
                        baseClassName="rounded-md border border-slate-200 bg-white text-slate-700"
                        className="hover:bg-slate-50"
                      >
                        <CloseRoundedIcon sx={{ fontSize: 18 }} />
                      </AdminIconActionButton>
                    ) : null}

                    {visibleActions.archive ? (
                      <AdminIconActionButton
                        onClick={() => onArchive(row)}
                        disabled={busy}
                        label="Archive"
                        sizeClassName="h-7 w-7"
                        baseClassName="rounded-md border border-amber-200 bg-amber-50 text-amber-700"
                        className="hover:bg-amber-100"
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                      </AdminIconActionButton>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}

          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12 text-center text-sm text-slate-500">
                No events match the current filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
