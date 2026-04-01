import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { formatPhaseLabel } from "./tierChangeManagement.utils";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "../ui/AdminWorkspaceHero";

export default function TierChangeManagementHeader({
  loadingData,
  loadingPhases,
  onRefreshData,
  onRefreshPhases,
  previewMeta,
  selectedPhaseId
}) {
  return (
    <AdminWorkspaceHero
      eyebrow="Tier Change Workspace"
      title="Tier Change Management"
      description={
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
            Selected: {previewMeta.phase ? formatPhaseLabel(previewMeta.phase) : "No phase selected"}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
            Previous: {formatPhaseLabel(previewMeta.previous_phase)}
          </span>
        </div>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <AdminWorkspaceHeroActionButton
            type="button"
            onClick={onRefreshData}
            disabled={!selectedPhaseId || loadingData}
            className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            {loadingData ? "Refreshing..." : "Refresh Data"}
          </AdminWorkspaceHeroActionButton>

          <AdminWorkspaceHeroActionButton
            type="button"
            onClick={onRefreshPhases}
            disabled={loadingPhases}
            className="bg-[#1754cf] text-white shadow-lg shadow-[#1754cf]/20 hover:opacity-90"
          >
            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            {loadingPhases ? "Refreshing..." : "Refresh Phases"}
          </AdminWorkspaceHeroActionButton>
        </div>
      }
    />
  );
}
