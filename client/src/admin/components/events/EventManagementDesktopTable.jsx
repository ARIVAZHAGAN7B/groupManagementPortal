import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  REGISTRATION_STATE_STYLES,
  STATUS_STYLES,
  formatDate,
  formatDateRange,
  formatMemberRange,
  getEventActionDisabledState,
  getRegistrationState
} from "./eventManagement.constants";
import {
  AdminBadge,
  AdminIconActionButton,
  AdminMappedBadge,
  AdminTextActionButton
} from "../ui/AdminUiPrimitives";

export default function EventManagementDesktopTable({
  actionBusyId,
  onActivate,
  onArchive,
  onClose,
  onDeactivate,
  onEdit,
  onView,
  rows
}) {
  return (
    <div className="hidden overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <table className="min-w-[1160px] w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {[
              "Event",
              "Event Window",
              "Registration",
              "Capacity",
              "Status",
              "Groups",
              "Updated",
              "Actions"
            ].map((header) => (
              <th
                key={header}
                className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
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
            const disabled = getEventActionDisabledState(row.status);
            const registrationState = getRegistrationState(
              row.registration_start_date,
              row.registration_end_date
            );

            return (
              <tr key={eventId} className="transition hover:bg-slate-50">
                <td className="px-4 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{row.event_name || "-"}</p>
                      <AdminBadge className="border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-[10px] text-slate-600">
                        {row.event_code || "NO-CODE"}
                      </AdminBadge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.location || "Location not specified"}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-4 text-xs text-slate-600">
                  {formatDateRange(row.start_date, row.end_date)}
                </td>

                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <AdminBadge
                      className={`px-2.5 py-0.5 text-[10px] ${REGISTRATION_STATE_STYLES[registrationState.key]}`}
                    >
                      {registrationState.label}
                    </AdminBadge>
                    <p className="text-xs text-slate-500">
                      {formatDateRange(
                        row.registration_start_date,
                        row.registration_end_date
                      )}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                  {formatMemberRange(row.min_members, row.max_members)}
                </td>

                <td className="px-4 py-4">
                  <AdminMappedBadge map={STATUS_STYLES} value={row.status} />
                </td>

                <td className="px-4 py-4 text-xs font-semibold text-slate-700 tabular-nums">
                  {Number(row.team_count || 0)}
                </td>

                <td className="px-4 py-4 text-xs text-slate-500">
                  {formatDate(row.updated_at)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AdminIconActionButton
                      onClick={() => onView(row)}
                      label={`View ${row.event_name || "event"}`}
                      baseClassName="rounded-md border border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf]"
                      className="hover:bg-[#1754cf]/12"
                    >
                      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    </AdminIconActionButton>

                    <AdminTextActionButton
                      onClick={() => onEdit(row)}
                      disabled={busy}
                      label="Edit"
                      fullWidth={false}
                      className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    />

                    <AdminTextActionButton
                      onClick={() => onActivate(row)}
                      disabled={busy || disabled.activate}
                      label="Activate"
                      fullWidth={false}
                      className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    />

                    <AdminTextActionButton
                      onClick={() => onClose(row)}
                      disabled={busy || disabled.close}
                      label="Close"
                      fullWidth={false}
                      className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    />

                    <AdminTextActionButton
                      onClick={() => onArchive(row)}
                      disabled={busy || disabled.archive}
                      label="Archive"
                      fullWidth={false}
                      className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    />

                    <AdminTextActionButton
                      onClick={() => onDeactivate(row)}
                      disabled={busy || disabled.inactive}
                      label={busy ? "Working..." : "Set Inactive"}
                      fullWidth={false}
                      className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    />
                  </div>
                </td>
              </tr>
            );
          })}

          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                No events match the current filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
