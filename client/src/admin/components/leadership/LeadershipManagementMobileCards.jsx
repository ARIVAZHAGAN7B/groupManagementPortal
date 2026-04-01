import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  AdminMobileCard,
  AdminMobileCardList,
  AdminMobileValueRow
} from "../ui/AdminMobileCards";
import {
  AdminBadge,
  AdminStatusDotBadge
} from "../ui/AdminUiPrimitives";
import {
  formatDateTime,
  getRoleBadgeClass,
  getStatusConfig,
  getTierBadgeClass
} from "./leadership.constants";

export default function LeadershipManagementMobileCards({
  busyRequestId,
  onApprove,
  onOpenGroup,
  onReject,
  rows
}) {
  return (
    <AdminMobileCardList
      items={rows}
      emptyMessage="No leadership requests found for current filters."
      renderItem={(row) => {
        const isBusy = busyRequestId === row.leadership_request_id;
        const statusConfig = getStatusConfig(row.group_status);

        return (
          <AdminMobileCard key={row.leadership_request_id}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900">{row.group_name || "-"}</h4>
                <p className="mt-1 text-xs font-mono font-bold uppercase text-[#1754cf]">
                  {row.group_code || "-"}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Request #{row.leadership_request_id}
                </p>
              </div>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getTierBadgeClass(
                  row.group_tier
                )}`}
              >
                Tier {String(row.group_tier || "-").toUpperCase()}
              </span>
            </div>

            <AdminMobileValueRow
              label="Status"
              valueClassName="max-w-[60%]"
              value={
                <AdminStatusDotBadge
                  config={statusConfig}
                  className="justify-end"
                />
              }
            />
            <AdminMobileValueRow
              label="Student"
              value={row.student_name || "-"}
              valueClassName="max-w-[60%] font-bold text-slate-900"
            />
            <AdminMobileValueRow
              label="Student ID"
              value={row.student_id || "-"}
              valueClassName="max-w-[60%] font-mono text-slate-500"
            />
            <AdminMobileValueRow
              label="Requested"
              value={
                <AdminBadge className={getRoleBadgeClass(row.requested_role)}>
                  {String(row.requested_role || "-").replaceAll("_", " ")}
                </AdminBadge>
              }
              valueClassName="max-w-[60%]"
            />
            <AdminMobileValueRow
              label="Current"
              value={
                <AdminBadge className={getRoleBadgeClass(row.current_membership_role)}>
                  {String(row.current_membership_role || "-").replaceAll("_", " ")}
                </AdminBadge>
              }
              valueClassName="max-w-[60%]"
            />
            <AdminMobileValueRow
              label="Requested At"
              value={formatDateTime(row.request_date)}
              valueClassName="max-w-[60%] text-slate-600"
            />

            {row.request_reason ? (
              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {row.request_reason}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => onOpenGroup(row.group_id)}
                className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 p-2"
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                <span className="text-[8px] font-bold uppercase">Open</span>
              </button>

              <button
                type="button"
                onClick={() => onApprove(row)}
                disabled={isBusy}
                className="flex flex-col items-center gap-1 rounded-lg bg-green-50 p-2 text-green-600 disabled:opacity-60"
              >
                <CheckRoundedIcon sx={{ fontSize: 16 }} />
                <span className="text-[8px] font-bold uppercase">
                  {isBusy ? "..." : "Approve"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onReject(row)}
                disabled={isBusy}
                className="flex flex-col items-center gap-1 rounded-lg bg-red-50 p-2 text-red-600 disabled:opacity-60"
              >
                <CloseRoundedIcon sx={{ fontSize: 16 }} />
                <span className="text-[8px] font-bold uppercase">
                  {isBusy ? "..." : "Reject"}
                </span>
              </button>
            </div>
          </AdminMobileCard>
        );
      }}
    />
  );
}
