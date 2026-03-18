import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  formatDateTime,
  getRoleBadgeClass,
  getStatusConfig,
  getTierBadgeClass
} from "./leadership.constants";

function TierBadge({ tier }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getTierBadgeClass(tier)}`}
    >
      Tier {String(tier || "-").toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = getStatusConfig(status);

  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
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

function ActionIconButton({ className = "", label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function ActionTextButton({ className = "", disabled = false, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full whitespace-nowrap rounded-md px-2.5 py-1 text-center text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {label}
    </button>
  );
}

export default function LeadershipManagementDesktopTable({
  busyRequestId,
  onApprove,
  onOpenGroup,
  onReject,
  rows,
  totalCount
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-6 py-4">Group</th>
              <th className="px-6 py-4 text-center">Tier</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Requested</th>
              <th className="px-6 py-4">Current</th>
              <th className="px-6 py-4">Requested At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => {
                const isBusy = busyRequestId === row.leadership_request_id;

                return (
                  <tr key={row.leadership_request_id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{row.group_name || "-"}</div>
                      <div className="text-[10px] font-mono font-bold uppercase text-[#1754cf]">
                        {row.group_code || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <TierBadge tier={row.group_tier} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.group_status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">{row.student_name || "-"}</div>
                      <div className="text-[10px] font-mono text-slate-400">{row.student_id || "-"}</div>
                      <div className="text-[10px] text-slate-400">{row.student_email || "-"}</div>
                      <div className="mt-1 text-[10px] font-mono text-slate-400">
                        Request #{row.leadership_request_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={row.requested_role} />
                      {row.request_reason ? (
                        <div className="mt-1 max-w-[220px] text-[10px] text-slate-400">
                          {row.request_reason}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={row.current_membership_role} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDateTime(row.request_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="ml-auto grid grid-cols-[2rem_4.75rem_4.75rem] items-center justify-end gap-2">
                        <ActionIconButton
                          label="Open group"
                          onClick={() => onOpenGroup(row.group_id)}
                          className="hover:bg-slate-100"
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </ActionIconButton>

                        <ActionTextButton
                          label={isBusy ? "..." : "Approve"}
                          onClick={() => onApprove(row)}
                          disabled={isBusy}
                          className="border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                        />

                        <ActionTextButton
                          label={isBusy ? "..." : "Reject"}
                          onClick={() => onReject(row)}
                          disabled={isBusy}
                          className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                  No leadership requests found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between bg-slate-50 px-6 py-4">
        <p className="text-xs font-medium text-slate-500">
          Showing {rows.length} of {totalCount} requests
        </p>
        <p className="text-xs font-medium text-slate-500">All matching requests are listed</p>
      </div>
    </section>
  );
}
