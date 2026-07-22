export const ALL_GROUPS_BADGE_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  FROZEN: "border-sky-200 bg-sky-50 text-sky-700",
  ARCHIVED: "border-rose-200 bg-rose-50 text-rose-700",
  COMPLETED: "border-violet-200 bg-violet-50 text-violet-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
  ELIGIBLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  NOT_ELIGIBLE: "border-red-200 bg-red-50 text-red-700",
  NOT_EVALUATED: "border-slate-200 bg-slate-100 text-slate-600",
  CAPTAIN: "border-amber-200 bg-amber-50 text-amber-700",
  VICE_CAPTAIN: "border-indigo-200 bg-indigo-50 text-indigo-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-700",
  EVENT: "border-blue-200 bg-blue-50 text-blue-700",
  REGULAR: "border-slate-200 bg-slate-100 text-slate-700",
  ACTIVE_MEMBER: "border-emerald-200 bg-emerald-50 text-emerald-700",
  NO_REQUEST: "border-slate-200 bg-slate-100 text-slate-600",
  REQUESTED: "border-amber-200 bg-amber-50 text-amber-700",
  OPEN: "border-emerald-200 bg-emerald-50 text-emerald-700",
  UPCOMING: "border-sky-200 bg-sky-50 text-sky-700",
  CLOSED: "border-rose-200 bg-rose-50 text-rose-700",
  YES: "border-emerald-200 bg-emerald-50 text-emerald-700",
  NO: "border-slate-200 bg-slate-100 text-slate-600",
  UNKNOWN: "border-slate-200 bg-slate-100 text-slate-600",
  A: "border-amber-200 bg-amber-50 text-amber-700",
  B: "border-slate-200 bg-slate-100 text-slate-700",
  C: "border-blue-200 bg-blue-50 text-blue-700",
  D: "border-violet-200 bg-violet-50 text-violet-700",
  TIER_A: "border-amber-200 bg-amber-50 text-amber-700",
  TIER_B: "border-slate-200 bg-slate-100 text-slate-700",
  TIER_C: "border-blue-200 bg-blue-50 text-blue-700",
  TIER_D: "border-violet-200 bg-violet-50 text-violet-700"
};

export const formatPoints = (value) => Number(value || 0).toLocaleString();

export const hasRank = (value) =>
  value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) > 0;

export const formatRankText = (label, value) =>
  hasRank(value) ? `${label} #${Number(value)}` : `${label} Not ranked`;

export const formatRankValue = (value) =>
  hasRank(value) ? String(Number(value)) : "-";

export const formatYesNoText = (value) =>
  value === true ? "Yes" : value === false ? "No" : "-";

export const formatEligibilityLabel = (value) => {
  const status = String(value || "").toUpperCase();
  if (status === "ELIGIBLE") return "Eligible";
  if (status === "NOT_ELIGIBLE") return "Not eligible";
  if (status === "NOT_EVALUATED") return "Not evaluated";
  return "-";
};

export const formatVacancyCount = (value) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "-";
  }

  return String(Math.max(0, Number(value)));
};

export const formatVacancyText = (value) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "Vacancy unavailable";
  }

  const vacancies = Number(value);
  if (vacancies <= 0) return "Full";
  return `${vacancies} Vacanc${vacancies === 1 ? "y" : "ies"}`;
};

export const formatMemberText = (value) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "-";
  }

  const count = Number(value);
  return `${count} Member${count === 1 ? "" : "s"}`;
};
