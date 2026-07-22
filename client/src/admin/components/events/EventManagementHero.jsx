import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "../ui/AdminWorkspaceHero";
import { AdminBadge } from "../ui/AdminUiPrimitives";

export default function EventManagementHero({
  editingId,
  loading,
  onRefresh,
  onStartCreate
}) {
  return (
    <AdminWorkspaceHero
      eyebrow="Participation Workspace"
      title="Event Listings"
      titleMeta={
        editingId ? (
          <AdminBadge className="border-[#1754cf]/15 bg-white/90 text-[#1754cf]">
            Editing Listing #{editingId}
          </AdminBadge>
        ) : null
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <AdminWorkspaceHeroActionButton
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            {loading ? "Refreshing..." : "Refresh"}
          </AdminWorkspaceHeroActionButton>

          <AdminWorkspaceHeroActionButton
            type="button"
            onClick={onStartCreate}
            className="bg-[#1754cf] text-white shadow-lg shadow-[#1754cf]/20 hover:opacity-90"
          >
            <AddRoundedIcon sx={{ fontSize: 18 }} />
            Add Event Listing
          </AdminWorkspaceHeroActionButton>
        </div>
      }
    />
  );
}
