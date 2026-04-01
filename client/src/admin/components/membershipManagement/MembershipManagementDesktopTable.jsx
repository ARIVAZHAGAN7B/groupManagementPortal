import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import {
  ROLE_STYLES,
  TIER_STYLES,
  formatDate,
  getMembershipStatusConfig,
  normalizeBadgeKey
} from "./membershipManagement.constants";

function Badge({ map, value }) {
  const normalized = normalizeBadgeKey(value);
  const cls = map?.[normalized] ?? "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${cls}`}>
      {normalized ? normalized.replaceAll("_", " ") : "-"}
    </span>
  );
}

function StatusBadge({ value }) {
  const config = getMembershipStatusConfig(value);

  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default function MembershipManagementDesktopTable({
  actionBusyId,
  onManage,
  onRemove,
  rows
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Group</th>
              <th className="px-6 py-4 text-center">Tier</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Left</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => {
                const busy = actionBusyId === row.membership_id;
                const isActive = normalizeBadgeKey(row.membership_status) === "ACTIVE";

                return (
                  <tr key={row.membership_id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{row.student_name || "-"}</div>
                      <div className="text-[10px] font-mono font-bold text-[#1754cf]">{row.student_id || "-"}</div>
                      <div className="text-[10px] text-slate-400">{row.student_email || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{row.group_name || "-"}</div>
                      <div className="text-[10px] text-slate-400">Group ID {row.group_id || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge value={row.group_tier} map={TIER_STYLES} />
                    </td>
                    <td className="px-6 py-4">
                      <Badge value={row.role} map={ROLE_STYLES} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge value={row.membership_status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(row.join_date)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(row.leave_date)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="ml-auto grid w-[10rem] grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onManage(row)}
                          disabled={!row.group_id || busy}
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-center text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <LaunchRoundedIcon sx={{ fontSize: 15 }} />
                          Manage
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(row)}
                          disabled={!isActive || busy}
                          className="w-full whitespace-nowrap rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-center text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {busy ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                  No memberships found for the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
