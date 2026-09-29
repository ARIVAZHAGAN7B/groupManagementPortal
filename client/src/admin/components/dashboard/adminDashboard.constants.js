export const DAY_MS = 24 * 60 * 60 * 1000;
export const PHASE_END_HOUR = 18;

export const EMPTY_DATA = {
  eventGroups: [],
  events: [],
  groupEligibility: [],
  groups: [],
  hubs: [],
  onDutyRows: [],
  phases: [],
  studentEligibility: [],
  students: [],
  systemMetrics: null,
  teams: []
};

export const EMPTY_SOURCE_SUMMARY = {
  failed: [],
  loaded: 0,
  total: 0
};

export const BADGE_TONES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ARCHIVED: "border-rose-200 bg-rose-50 text-rose-700",
  CLOSED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-700",
  FROZEN: "border-amber-200 bg-amber-50 text-amber-700"
};

export const BAR_TONES = [
  "bg-[#1754cf]",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-indigo-500"
];

export const cn = (...values) => values.filter(Boolean).join(" ");
export const safeArray = (value) => (Array.isArray(value) ? value : []);
export const upper = (value) => String(value || "").trim().toUpperCase();
export const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
export const count = (value) => num(value).toLocaleString();
export const compact = (value) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(
    num(value)
  );
export const formatPercent = (value, digits = 0) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "N/A";
  }

  return `${(Number(value) * 100).toFixed(digits)}%`;
};
export const formatAverage = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "N/A"
    : Number(value).toFixed(1);
export const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
export const startOfDayMs = (value) => {
  const date = parseDate(value);
  if (!date) return NaN;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};
export const endOfDayMs = (value) => {
  const date = parseDate(value);
  if (!date) return NaN;
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};
export const shortDate = (value) => {
  const date = parseDate(value);
  if (!date) return "Unavailable";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};
export const dateTime = (value) => {
  const date = parseDate(value);
  if (!date) return "Unavailable";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
};
export const roleLabel = (role) =>
  String(role || "admin")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
export const isTrue = (value) =>
  value === true || value === 1 || value === "1" || String(value || "").trim().toLowerCase() === "true";
export const toPhaseEnd = (value) => {
  const date = parseDate(value);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), PHASE_END_HOUR, 0, 0, 0);
};
export const phaseProgress = (phase, nowMs) => {
  if (!phase?.start_date || !phase?.end_date) return null;
  const startMs = startOfDayMs(phase.start_date);
  const endMs = toPhaseEnd(phase.end_date)?.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }
  return Math.min(Math.max((nowMs - startMs) / (endMs - startMs), 0), 1);
};
export const phaseCountdown = (phase) => {
  if (!phase?.end_date) return "No active phase";
  const remaining = num(phase?.remaining_working_days);
  if (remaining <= 0) return "Phase ended";
  if (remaining === 1) return "1 working day left";
  return `${remaining} working days left`;
};
export const getGrowthWindowCounts = (rows, accessor, nowMs) => {
  const thresholds = {
    day: nowMs - DAY_MS,
    month: nowMs - DAY_MS * 30,
    week: nowMs - DAY_MS * 7
  };

  return safeArray(rows).reduce(
    (accumulator, row) => {
      const timestamp = parseDate(accessor(row))?.getTime();
      if (!Number.isFinite(timestamp)) {
        return accumulator;
      }

      if (timestamp >= thresholds.day) accumulator.day += 1;
      if (timestamp >= thresholds.week) accumulator.week += 1;
      if (timestamp >= thresholds.month) accumulator.month += 1;
      return accumulator;
    },
    { day: 0, month: 0, week: 0 }
  );
};
export const buildCountMap = (rows, accessor, fallbackLabel = "Unknown") =>
  safeArray(rows).reduce((accumulator, row) => {
    const key = String(accessor(row) || "").trim() || fallbackLabel;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
export const toSortedEntries = (map) =>
  Object.entries(map || {})
    .map(([label, value]) => ({ label, value: num(value) }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
export const buildStatusCounts = (rows, accessor = (row) => row?.status, presetStatuses = []) => {
  const counts = {};
  presetStatuses.forEach((status) => {
    counts[status] = 0;
  });

  safeArray(rows).forEach((row) => {
    const status = upper(accessor(row));
    if (!status) return;
    if (counts[status] === undefined) {
      counts[status] = 0;
    }
    counts[status] += 1;
  });

  return counts;
};
export const getDaysUntil = (value, nowMs) => {
  const endMs = endOfDayMs(value);
  if (!Number.isFinite(endMs)) return null;
  return Math.ceil((endMs - nowMs) / DAY_MS);
};
export const isRegistrationUpcoming = (event, nowMs) => {
  if (upper(event?.status) !== "ACTIVE") return false;
  const startMs = startOfDayMs(event?.registration_start_date);
  return Number.isFinite(startMs) && nowMs < startMs;
};
export const isRegistrationOpen = (event, nowMs) => {
  if (upper(event?.status) !== "ACTIVE") return false;

  const startMs = startOfDayMs(event?.registration_start_date);
  const endMs = endOfDayMs(event?.registration_end_date);

  if (Number.isFinite(startMs) && nowMs < startMs) return false;
  if (Number.isFinite(endMs) && nowMs > endMs) return false;

  return true;
};
export const isRegistrationClosed = (event, nowMs) => {
  const status = upper(event?.status);
  if (["CLOSED", "INACTIVE", "ARCHIVED"].includes(status)) return true;
  const endMs = endOfDayMs(event?.registration_end_date);
  return Number.isFinite(endMs) ? nowMs > endMs : false;
};
export const isUpcomingEvent = (event, nowMs) => {
  const startMs = startOfDayMs(event?.start_date);
  return Number.isFinite(startMs) && nowMs < startMs;
};
export const isCompletedEvent = (event, nowMs) => {
  const status = upper(event?.status);
  if (["CLOSED", "ARCHIVED"].includes(status)) return true;
  const endMs = endOfDayMs(event?.end_date);
  return Number.isFinite(endMs) && nowMs > endMs;
};
export const renderMetric = (value) =>
  value === null || value === undefined || value === "" ? "N/A" : value;
