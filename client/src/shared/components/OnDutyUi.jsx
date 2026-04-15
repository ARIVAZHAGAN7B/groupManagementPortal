import { API_BASE_URL } from "../../lib/api";

const EXTERNAL_STATUS_CLASS_NAMES = {
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  NOT_SUBMITTED: "border-slate-300 bg-slate-100 text-slate-600"
};

const ADMIN_STATUS_CLASS_NAMES = {
  ...EXTERNAL_STATUS_CLASS_NAMES,
  CANCELLED: "border-slate-300 bg-slate-100 text-slate-700"
};

export const ON_DUTY_EXTERNAL_STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];
export const ON_DUTY_ADMIN_STATUS_OPTIONS = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED"
];

const normalizeStatusKey = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export const formatOnDutyLabel = (value, fallback = "-") => {
  const normalized = String(value || "").trim();
  if (!normalized) return fallback;

  return normalized
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export const formatOnDutyDate = (value, fallback = "-") => {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString();
};

export const formatOnDutyDateRange = (startValue, endValue, emptyLabel = "-") => {
  if (!startValue && !endValue) return emptyLabel;

  const start = formatOnDutyDate(startValue, emptyLabel);
  const end = formatOnDutyDate(endValue || startValue, emptyLabel);
  if ((endValue || startValue) === startValue) return start;
  return `${start} to ${end}`;
};

export const formatOnDutyRoundDateRange = (round, emptyLabel = "Dates not set") =>
  formatOnDutyDateRange(round?.round_date, round?.round_end_date || round?.round_date, emptyLabel);

export const formatOnDutyTimeRange = (round, emptyLabel = "Time not set") => {
  const start = round?.start_time ? String(round.start_time).slice(0, 5) : "";
  const end = round?.end_time ? String(round.end_time).slice(0, 5) : "";

  if (!start && !end) return emptyLabel;
  return [start, end].filter(Boolean).join(" - ");
};

export const calculateOnDutyRoundDays = (round) => {
  if (!round?.round_date) return 0;

  const start = new Date(round.round_date);
  const end = new Date(round.round_end_date || round.round_date);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const msPerDay = 24 * 60 * 60 * 1000;
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const diff = Math.floor((endUtc - startUtc) / msPerDay);
  return diff >= 0 ? diff + 1 : 0;
};

export const getOnDutyUploadUrl = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
};

export const isOnDutyImageProof = (mimeType = "", filePath = "") => {
  const normalizedMimeType = String(mimeType || "").trim().toLowerCase();
  if (normalizedMimeType.startsWith("image/")) return true;

  return /\.(png|jpe?g|webp|gif)$/i.test(String(filePath || "").trim());
};

const getStatusClassName = (type, value) => {
  const normalized = normalizeStatusKey(value) || "PENDING";

  if (type === "external") {
    return EXTERNAL_STATUS_CLASS_NAMES[normalized] || EXTERNAL_STATUS_CLASS_NAMES.PENDING;
  }

  return ADMIN_STATUS_CLASS_NAMES[normalized] || ADMIN_STATUS_CLASS_NAMES.PENDING;
};

export function OnDutyStatusBadge({
  emptyLabel = "-",
  type = "admin",
  value
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(
        type,
        value
      )}`}
    >
      {formatOnDutyLabel(value, emptyLabel)}
    </span>
  );
}
