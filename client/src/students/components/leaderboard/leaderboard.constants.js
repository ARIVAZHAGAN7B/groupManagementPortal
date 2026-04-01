export const TABS = [
  { key: "individual", label: "Individual" },
  { key: "leaders", label: "Leaders" },
  { key: "groups", label: "Groups" }
];

export const TIER_OPTIONS = ["D", "C", "B", "A"];

export const filterInputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10";

export const formatPoints = (value) => Number(value || 0).toLocaleString();

export const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
};

export const getPhaseOptionLabel = (phase) => {
  const name = phase?.phase_name || "Unnamed Phase";
  const start = formatDate(phase?.start_date);
  const end = formatDate(phase?.end_date);
  const status = phase?.status ? ` | ${String(phase.status).toUpperCase()}` : "";
  return `${name} (${start} to ${end})${status}`;
};

export const getTierBadgeClass = (tier) => {
  const normalizedTier = String(tier || "").toUpperCase();

  switch (normalizedTier) {
    case "A":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "B":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "C":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "D":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

export const getGroupStatusBadgeClass = (status) => {
  const normalizedStatus = String(status || "").toUpperCase();

  switch (normalizedStatus) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INACTIVE":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "FROZEN":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};
