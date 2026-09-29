import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "./ui/AdminWorkspaceHero";

const formatStatusLabel = (status) => {
  const normalized = String(status || "").trim();
  return normalized ? normalized.toUpperCase() : "NO ACTIVE PHASE";
};

const buildWindowLabel = (changeDayRange, formatDate) => {
  if (!changeDayRange?.hasWindow) {
    return "Allowed window: not available yet";
  }

  return `Allowed window: ${formatDate(changeDayRange.min)} - ${formatDate(changeDayRange.max)}`;
};

export default function ChangeDayManagementPageHeader({
  changeDayRange,
  currentPhase,
  formatDate,
  loading,
  onRefresh
}) {
  const phaseName = currentPhase?.phase_name || currentPhase?.phase_id || "No active phase";
  const phaseRange = currentPhase?.phase_id
    ? `${formatDate(currentPhase?.start_date)} - ${formatDate(currentPhase?.end_date)}`
    : "No active phase schedule loaded";
  const currentChangeDay = currentPhase?.change_day
    ? `Current change day: ${formatDate(currentPhase.change_day)}`
    : "Current change day: not set";

  return (
    <AdminWorkspaceHero
      eyebrow="Active Phase Controls"
      title="Change Day Management"
      titleMeta={
        <span className="rounded-full border border-[#1754cf]/15 bg-white/85 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1754cf]">
          {formatStatusLabel(currentPhase?.status)}
        </span>
      }
      description={
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
            {phaseName}
          </span>
          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
            Phase range: {phaseRange}
          </span>
          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
            {currentChangeDay}
          </span>
          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
            {buildWindowLabel(changeDayRange, formatDate)}
          </span>
        </div>
      }
      descriptionClassName="mt-3"
      actions={
        <AdminWorkspaceHeroActionButton
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshRoundedIcon sx={{ fontSize: 18 }} />
          {loading ? "Refreshing..." : "Refresh"}
        </AdminWorkspaceHeroActionButton>
      }
    />
  );
}
