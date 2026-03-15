export const BADGE_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  COMPLETED: "border-blue-200 bg-blue-50 text-blue-700",
  FROZEN: "border-sky-200 bg-sky-50 text-sky-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  CAPTAIN: "border-amber-300 bg-amber-50 text-amber-800",
  VICE_CAPTAIN: "border-violet-200 bg-violet-50 text-violet-700",
  STRATEGIST: "border-blue-200 bg-blue-50 text-blue-700",
  MANAGER: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-700",
  TIER_A: "border-amber-200 bg-amber-50 text-amber-700",
  TIER_B: "border-slate-200 bg-slate-100 text-slate-700",
  TIER_C: "border-blue-200 bg-blue-50 text-blue-700",
  TIER_D: "border-violet-200 bg-violet-50 text-violet-700",
  YES: "border-emerald-200 bg-emerald-50 text-emerald-700",
  NO: "border-red-200 bg-red-50 text-red-700",
  ELIGIBLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  NOT_ELIGIBLE: "border-red-200 bg-red-50 text-red-700",
  NOT_AVAILABLE: "border-slate-200 bg-slate-100 text-slate-600",
  UNKNOWN: "border-slate-200 bg-slate-100 text-slate-600"
};

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(raw);
  if (dateOnlyMatch) {
    return new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3])
    );
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDate = (value) => {
  if (!value) return "-";
  const d = parseDateValue(value);
  if (!d || Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const d = parseDateValue(value);
  if (!d || Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

export const formatTime = (value) => {
  if (!value) return "-";

  const raw = String(value).trim();
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw);
  if (match) {
    return `${String(match[1]).padStart(2, "0")}:${match[2]}`;
  }

  return raw;
};
