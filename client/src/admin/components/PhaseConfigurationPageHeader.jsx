import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "./ui/AdminWorkspaceHero";

export default function PhaseConfigurationPageHeader({
  description = "Create academic or operational phases and configure eligibility targets.",
  loading,
  onRefresh,
  title = "Phase Configuration",
  workspaceLabel = "Phase Workspace"
}) {
  return (
    <AdminWorkspaceHero
      eyebrow={workspaceLabel}
      title={title}
      description={description}
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
