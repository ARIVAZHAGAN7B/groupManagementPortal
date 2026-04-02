import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  STATUS_STYLES,
  formatCountValue,
  formatDate,
  formatDurationDays,
  getBalanceCount,
  getVisibleEventStatusActions
} from "./eventManagement.constants";
import {
  AdminIconActionButton,
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
        const visibleActions = getVisibleEventStatusActions(row.status);
        const durationLabel = formatDurationDays(
          row.start_date,
          row.end_date,
          row.duration_days
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
                  {row.event_organizer || row.location || "Event details not specified"}
                </p>
                {busy ? (
                  <p className="mt-2 text-xs font-semibold text-[#1754cf]">Updating event...</p>
                ) : null}
              </div>

              <AdminMappedBadge map={STATUS_STYLES} value={row.status} />
            </div>

            <div className="mt-4">
              <AdminMobileValueRow label="ID" value={String(eventId)} />
              <AdminMobileValueRow label="Category" value={row.event_category || "-"} />
              <AdminMobileValueRow label="Location" value={row.location || "-"} />
              <AdminMobileValueRow label="Start Date" value={formatDate(row.start_date)} />
              <AdminMobileValueRow label="End Date" value={formatDate(row.end_date)} />
              <AdminMobileValueRow
                label="Duration"
                value={durationLabel === "-" ? "-" : `${durationLabel} day(s)`}
              />
              <AdminMobileValueRow label="Maximum Count" value={formatCountValue(row.maximum_count)} />
              <AdminMobileValueRow label="Applied Count" value={formatCountValue(row.applied_count)} />
              <AdminMobileValueRow
                label="Balance Count"
                value={getBalanceCount(row.maximum_count, row.applied_count)}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AdminTextActionButton
                onClick={() => onView(row)}
                label="View Details"
                fullWidth={false}
                sizeClassName="px-3 py-2"
                className="border border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf] hover:bg-[#1754cf]/12"
              />
              <AdminIconActionButton
                onClick={() => onEdit(row)}
                disabled={busy}
                label="Edit"
                sizeClassName="h-10 w-10"
                baseClassName="rounded-lg border border-slate-200 bg-white text-slate-700"
                className="hover:bg-slate-50"
              >
                <EditOutlinedIcon sx={{ fontSize: 20 }} />
              </AdminIconActionButton>

              {visibleActions.activate ? (
                <AdminTextActionButton
                  onClick={() => onActivate(row)}
                  disabled={busy}
                  label="Activate"
                  fullWidth={false}
                  sizeClassName="px-3 py-2"
                  className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                />
              ) : null}

              {visibleActions.close ? (
                <AdminIconActionButton
                  onClick={() => onClose(row)}
                  disabled={busy}
                  label="Close"
                  sizeClassName="h-10 w-10"
                  baseClassName="rounded-lg border border-slate-200 bg-white text-slate-700"
                  className="hover:bg-slate-50"
                >
                  <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </AdminIconActionButton>
              ) : null}

              {visibleActions.archive ? (
                <AdminIconActionButton
                  onClick={() => onArchive(row)}
                  disabled={busy}
                  label="Archive"
                  sizeClassName="h-10 w-10"
                  baseClassName="rounded-lg border border-amber-200 bg-amber-50 text-amber-700"
                  className="hover:bg-amber-100"
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
                </AdminIconActionButton>
              ) : null}
            </div>
          </AdminMobileCard>
        );
      }}
    />
  );
}
