import {
  formatPercentLabel,
  inputClass
} from "../groups/groupManagement.constants";

export { inputClass };

export const selectClass = `${inputClass} appearance-none pr-10`;

export const ROLE_STYLES = {
  CAPTAIN: "border-blue-200 bg-blue-50 text-blue-700",
  VICE_CAPTAIN: "border-purple-200 bg-purple-50 text-purple-700",
  STRATEGIST: "border-indigo-200 bg-indigo-50 text-indigo-700",
  MANAGER: "border-amber-200 bg-amber-50 text-amber-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-600"
};

export const MEMBERSHIP_STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  LEFT: "border-slate-200 bg-slate-100 text-slate-600",
  KICKED: "border-red-200 bg-red-50 text-red-700"
};

export const MEMBERSHIP_STATUS_CONFIG = {
  ACTIVE: {
    dot: "bg-green-600",
    text: "text-green-600",
    label: "ACTIVE"
  },
  LEFT: {
    dot: "bg-slate-400",
    text: "text-slate-400",
    label: "LEFT"
  },
  KICKED: {
    dot: "bg-red-500",
    text: "text-red-500",
    label: "KICKED"
  }
};

export const TIER_STYLES = {
  A: "border-blue-200 bg-blue-50 text-blue-700",
  B: "border-purple-200 bg-purple-50 text-purple-700",
  C: "border-orange-200 bg-orange-50 text-orange-700",
  D: "border-slate-200 bg-slate-100 text-slate-600"
};

export const MEMBERSHIP_STATUS_OPTIONS = ["ALL", "ACTIVE", "LEFT", "KICKED"];

export const normalizeBadgeKey = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export const getMembershipStatusConfig = (value) =>
  MEMBERSHIP_STATUS_CONFIG[normalizeBadgeKey(value)] || MEMBERSHIP_STATUS_CONFIG.LEFT;

export const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString();
};

export const filterMembershipRows = (
  rows,
  { query = "", roleFilter = "ALL", statusFilter = "ALL" }
) => {
  const search = String(query || "").trim().toLowerCase();

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const role = normalizeBadgeKey(row?.role);
    const status = normalizeBadgeKey(row?.membership_status);

    if (roleFilter !== "ALL" && role !== roleFilter) return false;
    if (statusFilter !== "ALL" && status !== statusFilter) return false;

    if (!search) return true;

    return [
      row?.membership_id,
      row?.student_id,
      row?.student_name,
      row?.student_email,
      row?.group_name,
      row?.group_tier,
      row?.role,
      row?.membership_status
    ]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ")
      .includes(search);
  });
};

export const buildMembershipStatCards = (rows) => {
  const all = Array.isArray(rows) ? rows : [];
  const total = all.length;
  const active = all.filter(
    (row) => normalizeBadgeKey(row?.membership_status) === "ACTIVE"
  ).length;
  const groups = new Set(
    all.map((row) => String(row?.group_id || "").trim()).filter(Boolean)
  ).size;
  const students = new Set(
    all.map((row) => String(row?.student_id || "").trim()).filter(Boolean)
  ).size;

  return [
    {
      accentClass: "bg-[#1754cf]",
      detail: "All memberships",
      label: "Total",
      value: total
    },
    {
      accentClass: "bg-green-500",
      detail: formatPercentLabel(active, total),
      label: "Active",
      value: active
    },
    {
      accentClass: "bg-sky-500",
      detail: `${groups} group${groups === 1 ? "" : "s"} in workspace`,
      label: "Groups",
      value: groups
    },
    {
      accentClass: "bg-slate-400",
      detail: `${students} unique student${students === 1 ? "" : "s"}`,
      label: "Students",
      value: students
    }
  ];
};
