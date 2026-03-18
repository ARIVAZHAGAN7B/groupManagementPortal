import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  formatDateTime,
  getRoleBadgeClass,
  getStatusConfig,
  getTierBadgeClass
} from "./leadership.constants";

function DetailRow({ label, value, valueClassName = "font-bold text-slate-900" }) {
  return (
    <div className="flex items-start justify-between border-t border-slate-100 py-2 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`max-w-[60%] text-right ${valueClassName}`}>{value}</span>
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeClass(role)}`}
    >
      {String(role || "-").replaceAll("_", " ")}
    </span>
  );
}

export default function LeadershipManagementMobileCards({
  busyRequestId,
  onApprove,
  onOpenGroup,
  onReject,
  rows
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
        No leadership requests found for current filters.
      </div>
    );
  }

  return (
    <section className="space-y-4 lg:hidden">
      {rows.map((row) => {
        const isBusy = busyRequestId === row.leadership_request_id;
        const statusConfig = getStatusConfig(row.group_status);

        return (
          <article
            key={row.leadership_request_id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
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

            <DetailRow
              label="Status"
              value={statusConfig.label}
              valueClassName={`font-bold ${statusConfig.text}`}
            />
            <DetailRow label="Student" value={row.student_name || "-"} />
            <DetailRow
              label="Student ID"
              value={row.student_id || "-"}
              valueClassName="font-mono text-slate-500"
            />
            <DetailRow label="Requested" value={<RoleBadge role={row.requested_role} />} />
            <DetailRow label="Current" value={<RoleBadge role={row.current_membership_role} />} />
            <DetailRow
              label="Requested At"
              value={formatDateTime(row.request_date)}
              valueClassName="text-slate-600"
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
          </article>
        );
      })}
    </section>
  );
}
