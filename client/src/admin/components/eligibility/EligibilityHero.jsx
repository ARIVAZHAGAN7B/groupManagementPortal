import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  getPhaseLabel,
  getPhaseStatusPillClass
} from "./eligibility.constants";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "../ui/AdminWorkspaceHero";

export default function EligibilityHero({
  loading,
  onRefresh,
  phase,
  stats,
  viewMode
}) {
  return (
    <AdminWorkspaceHero
      eyebrow="Eligibility Workspace"
      title="Eligibility Management"
      titleMeta={
        <>
          {phase ? (
            <span className="rounded-full border border-[#1754cf]/15 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1754cf]">
              {getPhaseLabel(phase)}
            </span>
          ) : null}
          {phase?.status ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getPhaseStatusPillClass(
                phase.status
              )}`}
            >
              {phase.status}
            </span>
          ) : null}
        </>
      }
      actions={
        <AdminWorkspaceHeroActionButton
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          <RefreshRoundedIcon sx={{ fontSize: 18 }} />
          {loading ? "Refreshing..." : "Refresh"}
        </AdminWorkspaceHeroActionButton>
      }
    />
  );
}
