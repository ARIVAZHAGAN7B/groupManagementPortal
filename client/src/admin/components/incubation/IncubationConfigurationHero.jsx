import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "../ui/AdminWorkspaceHero";

export default function IncubationConfigurationHero({
  canSave,
  dirty,
  loading,
  onRefresh,
  onSave,
  saving
}) {
  return (
    <AdminWorkspaceHero
      eyebrow="Policy Workspace"
      title="Incubation Configuration"
      sectionClassName="rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-3.5 md:p-4"
      contentClassName="relative z-10 flex flex-col gap-2.5"
      titleClassName="text-xl font-bold tracking-tight text-slate-900 md:text-2xl"
      titleMeta={
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
            dirty
              ? "border border-amber-200 bg-amber-50 text-amber-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {dirty ? "Draft changes" : "Synced"}
        </span>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <AdminWorkspaceHeroActionButton
            type="button"
            onClick={onRefresh}
            disabled={loading || saving}
            className="border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 sm:text-sm"
          >
            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            {loading ? "Refreshing..." : "Refresh"}
          </AdminWorkspaceHeroActionButton>

          <AdminWorkspaceHeroActionButton
            type="button"
            onClick={onSave}
            disabled={saving || !canSave || !dirty}
            className="bg-[#1754cf] px-3 py-1.5 text-xs text-white shadow-lg shadow-[#1754cf]/20 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:text-sm"
          >
            <SaveRoundedIcon sx={{ fontSize: 18 }} />
            {saving ? "Saving..." : dirty ? "Save Changes" : "Saved"}
          </AdminWorkspaceHeroActionButton>
        </div>
      }
    />
  );
}
