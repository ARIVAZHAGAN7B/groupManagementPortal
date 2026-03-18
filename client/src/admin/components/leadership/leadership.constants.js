import {
  getStatusConfig,
  getTierBadgeClass,
  inputClass
} from "../groups/groupManagement.constants";

export { getStatusConfig, getTierBadgeClass, inputClass };

const ROLE_BADGE_STYLES = {
  CAPTAIN: "bg-blue-100 text-blue-700",
  VICE_CAPTAIN: "bg-violet-100 text-violet-700",
  STRATEGIST: "bg-indigo-100 text-indigo-700",
  MANAGER: "bg-amber-100 text-amber-700",
  MEMBER: "bg-slate-100 text-slate-700"
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export const getRoleBadgeClass = (role) =>
  ROLE_BADGE_STYLES[String(role || "").toUpperCase()] || "bg-slate-100 text-slate-700";

export const getGroupOptionLabel = (group) =>
  `${group?.group_name || "Group"} (${group?.group_code || group?.group_id || "-"})`;

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
