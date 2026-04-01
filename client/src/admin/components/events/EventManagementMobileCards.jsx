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
  AdminMappedBadge,
  AdminTextActionButton
} from "../ui/AdminUiPrimitives";
import {
  AdminMobileCard,
  AdminMobileCardList,
  AdminMobileValueRow
} from "../ui/AdminMobileCards";

export default function EventManagementMobileCards({
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
    <AdminMobileCardList
      items={rows}
      emptyMessage="No events match the current filters."
      renderItem={(row) => {
        const eventId = Number(row.event_id);
        const busy = actionBusyId === eventId;
        const disabled = getEventActionDisabledState(row.status);
        const registrationState = getRegistrationState(
          row.registration_start_date,
          row.registration_end_date
        );

        return (
          <AdminMobileCard key={eventId}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {row.event_name || "-"}
                  </h3>
                  <AdminBadge className="border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-[10px] text-slate-600">
                    {row.event_code || "NO-CODE"}
                  </AdminBadge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {row.location || "Location not specified"}
                </p>
                {busy ? (
                  <p className="mt-2 text-xs font-semibold text-[#1754cf]">Updating event...</p>
                ) : null}
              </div>

              <AdminMappedBadge map={STATUS_STYLES} value={row.status} />
            </div>

            <div className="mt-4">
              <AdminMobileValueRow label="Event Window" value={formatDateRange(row.start_date, row.end_date)} />
              <AdminMobileValueRow
                label="Registration"
                align="start"
                valueClassName="text-right"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-700">
                    {formatDateRange(
                      row.registration_start_date,
                      row.registration_end_date
                    )}
                  </div>
                  <AdminBadge
                    className={`px-2.5 py-0.5 text-[10px] ${REGISTRATION_STATE_STYLES[registrationState.key]}`}
                  >
                    {registrationState.label}
                  </AdminBadge>
                </div>
              </AdminMobileValueRow>
              <AdminMobileValueRow
                label="Capacity"
                value={formatMemberRange(row.min_members, row.max_members)}
              />
              <AdminMobileValueRow
                label="Event Groups"
                value={String(Number(row.team_count || 0))}
              />
              <AdminMobileValueRow
                label="Updated"
                value={formatDate(row.updated_at)}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <AdminTextActionButton
                onClick={() => onView(row)}
                label="View Details"
                className="border border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf] hover:bg-[#1754cf]/12"
              />
              <AdminTextActionButton
                onClick={() => onEdit(row)}
                disabled={busy}
                label="Edit"
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              />
              <AdminTextActionButton
                onClick={() => onActivate(row)}
                disabled={busy || disabled.activate}
                label="Activate"
                className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              />
              <AdminTextActionButton
                onClick={() => onClose(row)}
                disabled={busy || disabled.close}
                label="Close"
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              />
              <AdminTextActionButton
                onClick={() => onArchive(row)}
                disabled={busy || disabled.archive}
                label="Archive"
                className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              />
              <AdminTextActionButton
                onClick={() => onDeactivate(row)}
                disabled={busy || disabled.inactive}
                label={busy ? "Working..." : "Set Inactive"}
                className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              />
            </div>
          </AdminMobileCard>
        );
      }}
    />
  );
}
