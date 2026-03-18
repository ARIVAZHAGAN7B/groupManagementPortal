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

export default function MembershipManagementMobileCards({
  actionBusyId,
  onManage,
  onRemove,
  rows
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
        No memberships found for the current filters.
      </div>
    );
  }

  return (
    <section className="space-y-4 lg:hidden">
      {rows.map((row) => {
        const busy = actionBusyId === row.membership_id;
        const isActive = normalizeBadgeKey(row.membership_status) === "ACTIVE";
        const statusConfig = getMembershipStatusConfig(row.membership_status);

        return (
          <article
            key={row.membership_id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900">{row.student_name || "-"}</h4>
                <p className="mt-1 text-xs font-mono font-bold uppercase text-[#1754cf]">
                  {row.student_id || "-"}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {row.student_email || "-"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge value={row.group_tier} map={TIER_STYLES} />
                <Badge value={row.role} map={ROLE_STYLES} />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Status</span>
              <span className={`flex items-center gap-1 font-bold ${statusConfig.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            </div>

            <div className="flex items-start justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Group</span>
              <div className="text-right">
                <div className="font-bold text-slate-900">{row.group_name || "-"}</div>
                <div className="text-[10px] text-slate-400">Group ID {row.group_id || "-"}</div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Joined</span>
              <span className="font-bold text-slate-900">{formatDate(row.join_date)}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Left</span>
              <span className="font-bold text-slate-900">{formatDate(row.leave_date)}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Membership</span>
              <span className="font-mono text-[10px] text-slate-400">{row.membership_id || "-"}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => onManage(row)}
                disabled={!row.group_id || busy}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-50 p-2 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <LaunchRoundedIcon sx={{ fontSize: 16 }} />
                <span className="text-[10px] font-bold uppercase">Manage</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(row)}
                disabled={!isActive || busy}
                className="rounded-lg bg-red-50 p-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-[10px] font-bold uppercase">
                  {busy ? "Removing..." : "Remove"}
                </span>
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
