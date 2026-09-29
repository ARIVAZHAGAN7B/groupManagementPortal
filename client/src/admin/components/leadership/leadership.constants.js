import {
  getStatusConfig,
  getTierBadgeClass,
  inputClass
} from "../groups/groupManagement.constants";

export { getStatusConfig, getTierBadgeClass, inputClass };

const ROLE_BADGE_STYLES = {
  CAPTAIN: "border border-amber-300/60 bg-amber-50 text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300",
  VICE_CAPTAIN: "border border-violet-300/60 bg-violet-50 text-violet-800 dark:border-violet-700/50 dark:bg-violet-950/40 dark:text-violet-300",
  STRATEGIST: "border border-indigo-300/60 bg-indigo-50 text-indigo-800 dark:border-indigo-700/50 dark:bg-indigo-950/40 dark:text-indigo-300",
  MANAGER: "border border-sky-300/60 bg-sky-50 text-sky-800 dark:border-sky-700/50 dark:bg-sky-950/40 dark:text-sky-300",
  MEMBER: "border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export const getRoleBadgeClass = (role) =>
  ROLE_BADGE_STYLES[String(role || "").toUpperCase()] ||
  "border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

export const getGroupOptionLabel = (group) =>
  `${group?.group_name || "Squad"} (${group?.group_code || group?.group_id || "-"})`;

export const getRequestSearchText = (row) =>
  [
    row?.leadership_request_id,
    row?.group_name,
    row?.group_code,
    row?.group_tier,
    row?.group_status,
    row?.student_name,
    row?.student_id,
    row?.student_email,
    row?.requested_role,
    row?.current_membership_role,
    row?.request_reason
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
