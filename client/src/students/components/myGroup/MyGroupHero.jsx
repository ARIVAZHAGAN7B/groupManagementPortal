import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import StudentGroupHero from "../groups/StudentGroupHero";
import MyGroupBadge from "./MyGroupBadge";

const formatMetric = (value) => (Number(value) || 0).toLocaleString();

export default function MyGroupHero({
  actionsDisabled = false,
  data,
  loading = false,
  memberCount = 0,
  missingLeadershipRoles = [],
  onLeave,
  onRefresh
}) {
  const actions = (
    <>
      <button
        type="button"
        onClick={onRefresh}
        disabled={actionsDisabled || loading}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
      >
        <RefreshRoundedIcon sx={{ fontSize: 18 }} />
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      <button
        type="button"
        onClick={onLeave}
        disabled={actionsDisabled}
        className="inline-flex items-center rounded-lg border border-red-300 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
      >
        Leave Group
      </button>
    </>
  );

  const badges = (
    <>
      <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-[#1754cf]">
        {data?.group_code || "No code"}
      </span>
      <MyGroupBadge value={`Tier ${data?.tier || "-"}`} />
      <MyGroupBadge value={data?.group_status || "Unknown"} />
      <MyGroupBadge value={data?.role || "Member"} />
      <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
        {memberCount} Member{memberCount === 1 ? "" : "s"}
      </span>
      <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
        Base {formatMetric(data?.lifetime_base_points)}
      </span>
      <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-[#1754cf]">
        Bonus {formatMetric(data?.eligibility_bonus_points)}
      </span>
      <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
        Total {formatMetric(data?.lifetime_total_points)}
      </span>
    </>
  );

  return (
    <StudentGroupHero
      actions={actions}
      badges={badges}
      eyebrow="Group Workspace"
      missingLeadershipRoles={missingLeadershipRoles}
      title="My Group"
    />
  );
}
