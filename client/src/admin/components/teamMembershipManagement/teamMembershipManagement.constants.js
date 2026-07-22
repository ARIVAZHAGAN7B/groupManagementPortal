import {
  formatPercentLabel,
  inputClass
} from "../groups/groupManagement.constants";

export { inputClass };

export const selectClass = `${inputClass} appearance-none pr-10`;
export const roleSelectBaseClass =
  "rounded-md border px-2.5 py-2 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60";

export const MEMBERSHIP_STATUS_ORDER = ["ACTIVE", "LEFT"];
export const TEAM_ROLE_OPTIONS = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER", "MEMBER"];
export const HUB_ROLE_OPTIONS = ["MEMBER"];
export const EVENT_GROUP_ROLE_OPTIONS = ["CAPTAIN", "VICE_CAPTAIN", "MEMBER"];

const TEAM_TYPE_LABELS = {
  TEAM: "Team",
  HUB: "Hub",
  EVENT: "Event Group",
  SECTION: "Section"
};

export const ROLE_STYLES = {
  CAPTAIN: "border-amber-200 bg-amber-50 text-amber-700",
  VICE_CAPTAIN: "border-purple-200 bg-purple-50 text-purple-700",
  STRATEGIST: "border-indigo-200 bg-indigo-50 text-indigo-700",
  MANAGER: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-600"
};

export const TEAM_TYPE_STYLES = {
  TEAM: "border-blue-200 bg-blue-50 text-blue-700",
  HUB: "border-sky-200 bg-sky-50 text-sky-700",
  EVENT: "border-violet-200 bg-violet-50 text-violet-700",
  SECTION: "border-amber-200 bg-amber-50 text-amber-700"
};

const MEMBERSHIP_STATUS_CONFIG = {
  ACTIVE: {
    dot: "bg-green-600",
    text: "text-green-600",
    label: "ACTIVE"
  },
  LEFT: {
    dot: "bg-slate-400",
    text: "text-slate-400",
    label: "LEFT"
  }
};

const TEAM_STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FROZEN: "border-sky-200 bg-sky-50 text-sky-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  ARCHIVED: "border-amber-200 bg-amber-50 text-amber-700"
};

const TEAM_MEMBERSHIP_SCOPE_CONFIG = {
  TEAM: {
    scope: "TEAM",
    teamType: "TEAM",
    workspaceLabel: "Team Workspace",
    pageTitle: "Team Membership Management",
    pageDescription: "Manage team memberships and role assignments.",
    scopeLabel: "Team",
    scopeLabelPlural: "Teams",
    scopeSearchLabel: "team",
    scopedStatLabel: "Teams",
    emptyState: "No team memberships found for the current filters."
  },
  HUB: {
    scope: "HUB",
    teamType: "HUB",
    workspaceLabel: "Hub Workspace",
    pageTitle: "Hub Membership Management",
    pageDescription: "Manage hub memberships and role assignments.",
    scopeLabel: "Hub",
    scopeLabelPlural: "Hubs",
    scopeSearchLabel: "hub",
    scopedStatLabel: "Hubs",
    emptyState: "No hub memberships found for the current filters."
  },
  EVENT_GROUP: {
    scope: "EVENT_GROUP",
    teamType: "EVENT",
    workspaceLabel: "Event Group Workspace",
    pageTitle: "Event Group Membership Management",
    pageDescription: "Manage event-group memberships, event rosters, and role assignments.",
    scopeLabel: "Event Group",
    scopeLabelPlural: "Event Groups",
    scopeSearchLabel: "event group",
    scopedStatLabel: "Event Groups",
    emptyState: "No event-group memberships found for the current filters."
  }
};

export const normalizeTeamMembershipKey = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export const formatLabel = (value, fallback = "-") => {
  const normalized = normalizeTeamMembershipKey(value);
  if (!normalized) return fallback;

  return normalized
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export const formatTeamTypeLabel = (value, fallback = "-") => {
  const normalized = normalizeTeamMembershipKey(value);
  if (!normalized) return fallback;
  return TEAM_TYPE_LABELS[normalized] || formatLabel(normalized, fallback);
};

export const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString();
};

export const getRoleOptionsForTeamType = (teamType) =>
  normalizeTeamMembershipKey(teamType) === "EVENT"
    ? EVENT_GROUP_ROLE_OPTIONS
    : normalizeTeamMembershipKey(teamType) === "HUB"
      ? HUB_ROLE_OPTIONS
      : TEAM_ROLE_OPTIONS;

export const getRoleBadgeClass = (role) =>
  ROLE_STYLES[normalizeTeamMembershipKey(role)] || ROLE_STYLES.MEMBER;

export const getRoleSelectClass = (role) =>
  `${roleSelectBaseClass} ${
    ROLE_STYLES[normalizeTeamMembershipKey(role)] || ROLE_STYLES.MEMBER
  }`;

export const getTeamTypeBadgeClass = (teamType) =>
  TEAM_TYPE_STYLES[normalizeTeamMembershipKey(teamType)] || TEAM_TYPE_STYLES.SECTION;

export const getMembershipStatusConfig = (status) =>
  MEMBERSHIP_STATUS_CONFIG[normalizeTeamMembershipKey(status)] || MEMBERSHIP_STATUS_CONFIG.LEFT;

export const getTeamStatusBadgeClass = (status) =>
  TEAM_STATUS_STYLES[normalizeTeamMembershipKey(status)] || TEAM_STATUS_STYLES.ARCHIVED;

export const getTeamMembershipScopeConfig = (scope = "TEAM") =>
  TEAM_MEMBERSHIP_SCOPE_CONFIG[normalizeTeamMembershipKey(scope)] || TEAM_MEMBERSHIP_SCOPE_CONFIG.TEAM;

export const sortByPreferredOrder = (items, preferredOrder = []) => {
  const uniqueItems = Array.from(new Set((Array.isArray(items) ? items : []).filter(Boolean)));

  return uniqueItems.sort((left, right) => {
    const leftIndex = preferredOrder.indexOf(left);
    const rightIndex = preferredOrder.indexOf(right);

    if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex;
    if (leftIndex !== -1) return -1;
    if (rightIndex !== -1) return 1;
    return left.localeCompare(right);
  });
};

export const filterTeamMembershipRows = (
  rows,
  { query = "", statusFilter = "ALL" } = {}
) => {
  const search = String(query || "").trim().toLowerCase();

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const membershipStatus = normalizeTeamMembershipKey(row?.status);

    if (statusFilter !== "ALL" && membershipStatus !== statusFilter) return false;

    if (!search) return true;

    return [
      row?.team_membership_id,
      row?.student_id,
      row?.student_name,
      row?.department,
      row?.year,
      row?.team_code,
      row?.team_name,
      row?.team_type,
      row?.team_status,
      row?.status,
      row?.role,
      row?.event_name,
      row?.event_code,
      row?.event_status,
      row?.notes
    ]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ")
      .includes(search);
  });
};

export const buildTeamMembershipStatCards = (rows, scopeConfig) => {
  const all = Array.isArray(rows) ? rows : [];
  const total = all.length;
  const active = all.filter((row) => normalizeTeamMembershipKey(row?.status) === "ACTIVE").length;
  const teams = new Set(
    all.map((row) => String(row?.team_id || "").trim()).filter(Boolean)
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
      detail: `${teams} unique ${
        String(scopeConfig?.scopeSearchLabel || "team").toLowerCase()
      }${teams === 1 ? "" : "s"}`,
      label: scopeConfig?.scopedStatLabel || "Teams",
      value: teams
    },
    {
      accentClass: "bg-slate-400",
      detail: `${students} unique student${students === 1 ? "" : "s"}`,
      label: "Students",
      value: students
    }
  ];
};
