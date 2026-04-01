import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import {
  AdminMobileCard,
  AdminMobileCardList,
  AdminMobileValueRow
} from "../ui/AdminMobileCards";
import {
  AdminMappedBadge,
  AdminStatusDotBadge
} from "../ui/AdminUiPrimitives";
import {
  ROLE_STYLES,
  TIER_STYLES,
  formatDate,
  getMembershipStatusConfig,
  normalizeBadgeKey
} from "./membershipManagement.constants";

export default function MembershipManagementMobileCards({
  actionBusyId,
  onManage,
  onRemove,
  rows
}) {
  return (
    <AdminMobileCardList
      items={rows}
      emptyMessage="No memberships found for the current filters."
      renderItem={(row) => {
        const busy = actionBusyId === row.membership_id;
        const isActive = normalizeBadgeKey(row.membership_status) === "ACTIVE";
        const statusConfig = getMembershipStatusConfig(row.membership_status);

        return (
          <AdminMobileCard key={row.membership_id}>
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
                <AdminMappedBadge value={row.group_tier} map={TIER_STYLES} />
                <AdminMappedBadge value={row.role} map={ROLE_STYLES} />
              </div>
            </div>

            <AdminMobileValueRow label="Status">
              <AdminStatusDotBadge
                config={statusConfig}
                gapClassName="gap-1"
                textClassName="font-bold"
              />
            </AdminMobileValueRow>

            <AdminMobileValueRow label="Group" align="start">
              <div className="text-right">
                <div className="font-bold text-slate-900">{row.group_name || "-"}</div>
                <div className="text-[10px] text-slate-400">Group ID {row.group_id || "-"}</div>
              </div>
            </AdminMobileValueRow>

            <AdminMobileValueRow label="Joined" value={formatDate(row.join_date)} />
            <AdminMobileValueRow label="Left" value={formatDate(row.leave_date)} />
            <AdminMobileValueRow
              label="Membership"
              value={row.membership_id || "-"}
              valueClassName="font-mono text-[10px] text-slate-400"
            />

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
          </AdminMobileCard>
        );
      }}
    />
  );
}
