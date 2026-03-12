export const TIER_BADGE_STYLES = {
  A: "bg-amber-100 text-amber-600",
  B: "bg-slate-100 text-slate-600",
  C: "bg-blue-100 text-blue-600",
  D: "bg-violet-100 text-violet-600"
};

export const STATUS_BADGE_STYLES = {
  ACTIVE: {
    dot: "bg-green-600",
    text: "text-green-600",
    label: "ACTIVE"
  },
  FROZEN: {
    dot: "bg-sky-500",
    text: "text-sky-500",
    label: "FROZEN"
  },
  INACTIVE: {
    dot: "bg-slate-400",
    text: "text-slate-400",
    label: "INACTIVE"
  }
};

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10";

export const getTierBadgeClass = (tier) =>
  TIER_BADGE_STYLES[String(tier || "").toUpperCase()] || "bg-slate-100 text-slate-600";

export const getStatusConfig = (status) =>
  STATUS_BADGE_STYLES[String(status || "").toUpperCase()] || STATUS_BADGE_STYLES.INACTIVE;

export const getRatioPercent = (value, total) => {
  const safeTotal = Number(total) || 0;
  const safeValue = Number(value) || 0;

  if (safeTotal <= 0) return 0;
  return Math.max(0, Math.min((safeValue / safeTotal) * 100, 100));
};

export const formatPercentLabel = (value, total) => {
  const percent = getRatioPercent(value, total);
  return `${percent.toFixed(percent % 1 === 0 ? 0 : 1)}% of total`;
};

export const formatGroupMeta = (group) => {
  const activeMembers = Number(group?.active_member_count);
  if (Number.isFinite(activeMembers)) {
    return `${activeMembers} active member${activeMembers === 1 ? "" : "s"}`;
  }

  return `Group ID ${group?.group_id ?? "-"}`;
};

export const formatGroupPoints = (group) => {
  const totalPoints = Number(group?.total_points);
  return Number.isFinite(totalPoints) ? totalPoints : 0;
};
