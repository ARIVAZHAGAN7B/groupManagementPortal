import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "../ui/AdminWorkspaceHero";

export default function TeamMembershipManagementHero({
  loading,
  onRefresh,
  scopeConfig,
  totalCount
}) {
  return (
    <AdminWorkspaceHero
      eyebrow={scopeConfig?.workspaceLabel || "Team Workspace"}
      title={scopeConfig?.pageTitle || "Team Membership Management"}
      description={
        scopeConfig?.pageDescription || "Manage team memberships and role assignments."
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
