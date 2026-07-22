export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#0f6cbd] focus:ring-4 focus:ring-[#0f6cbd]/10";

export const selectClass = `${inputClass} appearance-none pr-10`;

export const TEAM_STATUSES = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];
export const HUB_PRIORITY_OPTIONS = ["PROMINENT", "MEDIUM", "LOW"];

export const STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FROZEN: "border-sky-200 bg-sky-50 text-sky-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  ARCHIVED: "border-amber-200 bg-amber-50 text-amber-700"
};

export const TYPE_STYLES = {
  TEAM: "border-[#0f6cbd]/20 bg-[#0f6cbd]/8 text-[#0f6cbd]",
  HUB: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  SECTION: "border-amber-200 bg-amber-50 text-amber-700",
  EVENT: "border-orange-200 bg-orange-50 text-orange-700"
};

export const HUB_PRIORITY_STYLES = {
  PROMINENT: "border-rose-200 bg-rose-50 text-rose-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

export const getScopeConfig = (scope = "TEAM") => {
  const normalized = String(scope || "TEAM").toUpperCase();

  if (normalized === "EVENT_GROUP") {
    return {
      accent: "text-[#1754cf]",
      allowCreate: false,
      createButtonLabel: "Edit Existing Group",
      emptyStateLabel: "No event groups found",
      heroBackground: "border-[#1754cf]/10 bg-[#1754cf]/5",
      heroGlow: "bg-[#1754cf]/10",
      scope: "EVENT_GROUP",
      teamType: "EVENT",
      scopeLabel: "Event Group",
      scopeLabelPlural: "Event Groups",
      searchPlaceholder: "Search by group code, event, status, or notes",
      workspaceLabel: "Event Group Workspace"
    };
  }

  if (normalized === "HUB") {
    return {
      accent: "text-[#1754cf]",
      allowCreate: true,
      createButtonLabel: "Create Hub",
      emptyStateLabel: "No hubs found",
      heroBackground: "border-[#1754cf]/10 bg-[#1754cf]/5",
      heroGlow: "bg-[#1754cf]/10",
      scope: "HUB",
      teamType: "HUB",
      scopeLabel: "Hub",
      scopeLabelPlural: "Hubs",
      searchPlaceholder: "Search by hub code, name, priority, status, or notes",
      workspaceLabel: "Hub Workspace"
    };
  }

  return {
    accent: "text-[#1754cf]",
    allowCreate: true,
    createButtonLabel: "Create Team",
    emptyStateLabel: "No teams found",
    heroBackground: "border-[#1754cf]/10 bg-[#1754cf]/5",
    heroGlow: "bg-[#1754cf]/10",
    scope: "TEAM",
    teamType: "TEAM",
    scopeLabel: "Team",
    scopeLabelPlural: "Teams",
    searchPlaceholder: "Search by team code, name, status, or notes",
    workspaceLabel: "Team Workspace"
  };
};

export const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString();
};

export const formatPercentLabel = (value, total) => {
  const safeTotal = Number(total) || 0;
  const safeValue = Number(value) || 0;
  if (!safeTotal) return "0% of total";
  return `${Math.round((safeValue / safeTotal) * 100)}% of total`;
};

export const formatTeamTypeLabel = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "SECTION") return "Legacy Section";
  if (normalized === "EVENT") return "Event Group";
  if (!normalized) return "-";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
};

export const formatHubPriorityLabel = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (!normalized) return "-";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
};

export const filterTeamRows = (rows, { query = "", statusFilter = "ALL", typeFilter = "ALL" }) => {
  const search = String(query || "").trim().toLowerCase();

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const status = String(row?.status || "").toUpperCase();
    const type = String(row?.team_type || "").toUpperCase();

    if (statusFilter !== "ALL" && status !== statusFilter) return false;
    if (typeFilter !== "ALL" && type !== typeFilter) return false;

    if (!search) return true;

    return [
      row?.team_id,
      row?.team_code,
      row?.team_name,
      row?.team_type,
      row?.hub_priority,
      row?.status,
      row?.description,
      row?.event_name,
      row?.event_code
    ]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ")
      .includes(search);
  });
};

export const buildStatCards = (rows, scope = "TEAM") => {
  const all = Array.isArray(rows) ? rows : [];
  const total = all.length;
  const active = all.filter((row) => String(row?.status || "").toUpperCase() === "ACTIVE").length;
  const frozen = all.filter((row) => String(row?.status || "").toUpperCase() === "FROZEN").length;
  const archived = all.filter((row) => String(row?.status || "").toUpperCase() === "ARCHIVED").length;
  const normalizedScope = String(scope || "TEAM").toUpperCase();

  const primaryAccentClass =
    normalizedScope ? "bg-[#1754cf]" : "bg-[#1754cf]";

  return [
    { accentClass: primaryAccentClass, label: "Total", value: total },
    { accentClass: "bg-emerald-500", label: "Active", value: active },
    { accentClass: "bg-sky-500", label: "Frozen", value: frozen },
    { accentClass: "bg-amber-500", label: "Archived", value: archived }
  ];
};

export const getActionDisabledState = (status) => {
  const normalized = String(status || "").toUpperCase();
  return {
    activate: normalized === "ACTIVE",
    archive: normalized === "ARCHIVED",
    freeze: normalized === "FROZEN",
    inactive: normalized === "INACTIVE"
  };
};
