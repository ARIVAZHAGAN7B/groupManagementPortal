export const ROLE_STYLES = {
  CAPTAIN: "border-blue-200 bg-blue-50 text-blue-700",
  VICE_CAPTAIN: "border-violet-200 bg-violet-50 text-violet-700",
  STRATEGIST: "border-indigo-200 bg-indigo-50 text-indigo-700",
  MANAGER: "border-amber-200 bg-amber-50 text-amber-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-600"
};

export const GROUP_STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FROZEN: "border-sky-200 bg-sky-50 text-sky-600",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-500"
};

export const TIER_STYLES = {
  A: "border-blue-200 bg-blue-50 text-blue-700",
  B: "border-violet-200 bg-violet-50 text-violet-700",
  C: "border-orange-200 bg-orange-50 text-orange-700",
  D: "border-slate-200 bg-slate-100 text-slate-600"
};

export const formatDate = (value) => {
  if (!value) return "-";

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  const parsed = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3])
      )
    : new Date(value);

  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
};

export const formatNumber = (value) => (Number(value) || 0).toLocaleString();

export const getBadgeClass = (value, map) => {
  const key = String(value || "").toUpperCase().replace(/\s+/g, "_");
  return map?.[key] || "border-slate-200 bg-slate-100 text-slate-600";
};

export const getMembershipState = (row) => (row?.group_id ? "IN_GROUP" : "UNGROUPED");

export const getGroupLabel = (row) => {
  if (!row?.group_id) return "No group";
  return row.group_name || "Unnamed group";
};

export const getGroupMeta = (row) => {
  if (!row?.group_id) return "Not assigned";
  return row.group_code || "No code";
};

export const getAcademicMeta = (row) => {
  const parts = [row?.department, row?.year ? `Year ${row.year}` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" | ") : "No academic details";
};

export const getStatusValue = (row) => row?.group_status || row?.membership_status || "";
