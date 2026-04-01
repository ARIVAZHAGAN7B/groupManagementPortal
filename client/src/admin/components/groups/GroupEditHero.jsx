import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  formatGroupPoints,
  getStatusConfig,
  getTierBadgeClass
} from "./groupManagement.constants";
import { AdminBadge, AdminStatusDotBadge } from "../ui/AdminUiPrimitives";

export default function GroupEditHero({ group, onBack }) {
  const activeMemberCount =
    group?.active_member_count === undefined || group?.active_member_count === null
      ? 0
      : Number(group.active_member_count);
  const statusConfig = getStatusConfig(group?.status);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-8">
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-[#1754cf]">
            Group Workspace
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Group</h1>
          <p className="mt-2 text-xl font-bold text-slate-900">{group?.group_name || "-"}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <AdminBadge className="items-center border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-[#1754cf]">
              {group?.group_code || "No code"}
            </AdminBadge>
            <AdminBadge
              className={`items-center px-3 py-1 text-xs font-semibold ${getTierBadgeClass(
                group?.tier
              )}`}
            >
              Tier {String(group?.tier || "-").toUpperCase()}
            </AdminBadge>
            <AdminBadge className="border-slate-200 bg-white px-3 py-1">
              <AdminStatusDotBadge
                config={statusConfig}
                dotClassName="h-2 w-2"
                gapClassName="gap-2"
                textClassName="text-sm font-bold"
              />
            </AdminBadge>
            <AdminBadge className="items-center border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
              {Number.isNaN(activeMemberCount) ? 0 : activeMemberCount} Active
            </AdminBadge>
            <AdminBadge className="items-center border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
              {formatGroupPoints(group)} Points
            </AdminBadge>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
          Back to Groups
        </button>
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}
