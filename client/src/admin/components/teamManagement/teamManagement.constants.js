export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#0f6cbd] focus:ring-4 focus:ring-[#0f6cbd]/10";

export const selectClass = `${inputClass} appearance-none pr-10`;

export const TEAM_STATUSES = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];

export const TEAM_FORM_TYPES = [
  {
    value: "TEAM",
    label: "Team",
    description: "Use for standard working teams and execution units."
  },
  {
    value: "HUB",
    label: "Hub",
    description: "Use for broader coordination groups or multi-team domains."
  }
];

export const TEAM_FILTER_TYPES = [
  { value: "ALL", label: "All Types" },
  { value: "TEAM", label: "Teams" },
  { value: "HUB", label: "Hubs" },
  { value: "SECTION", label: "Legacy Sections" }
];

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

export const getScopeConfig = (scope = "TEAM") => {
  const normalized = String(scope || "TEAM").toUpperCase();

  if (normalized === "EVENT_GROUP") {
    return {
      accent: "text-orange-600",
      allowCreate: false,
      createButtonLabel: "Edit Existing Group",
      emptyStateLabel: "No event groups found",
      heroBackground: "border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50",
      heroGlow: "bg-orange-300/20",
      scope: "EVENT_GROUP",
      scopeLabel: "Event Group",
      scopeLabelPlural: "Event Groups",
      searchPlaceholder: "Search by group code, event, status, or notes",
      workspaceLabel: "Event Group Workspace"
    };
  }

  return {
    accent: "text-[#0f6cbd]",
    allowCreate: true,
    createButtonLabel: "Create Team",
    emptyStateLabel: "No teams found",
    heroBackground: "border-[#0f6cbd]/15 bg-gradient-to-br from-[#0f6cbd]/8 via-white to-cyan-50",
    heroGlow: "bg-[#0f6cbd]/15",
    scope: "TEAM",
    scopeLabel: "Team",
    scopeLabelPlural: "Teams",
    searchPlaceholder: "Search by code, name, type, status, or notes",
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

  if (String(scope || "TEAM").toUpperCase() === "EVENT_GROUP") {
    const active = all.filter((row) => String(row?.status || "").toUpperCase() === "ACTIVE").length;
    const frozen = all.filter((row) => String(row?.status || "").toUpperCase() === "FROZEN").length;
    const archived = all.filter((row) => String(row?.status || "").toUpperCase() === "ARCHIVED").length;

    return [
      { accentClass: "bg-orange-500", label: "Total", value: total },
      { accentClass: "bg-emerald-500", label: "Active", value: active },
      { accentClass: "bg-sky-500", label: "Frozen", value: frozen },
      { accentClass: "bg-amber-500", label: "Archived", value: archived }
    ];
  }

  const active = all.filter((row) => String(row?.status || "").toUpperCase() === "ACTIVE").length;
  const hubs = all.filter((row) => String(row?.team_type || "").toUpperCase() === "HUB").length;
  const sections = all.filter((row) => String(row?.team_type || "").toUpperCase() === "SECTION").length;

  return [
    { accentClass: "bg-[#0f6cbd]", label: "Total", value: total },
    { accentClass: "bg-emerald-500", label: "Active", value: active },
    { accentClass: "bg-fuchsia-500", label: "Hubs", value: hubs },
    { accentClass: "bg-amber-500", label: "Legacy Sections", value: sections }
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
