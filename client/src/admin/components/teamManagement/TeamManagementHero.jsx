import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "../ui/AdminWorkspaceHero";

export default function TeamManagementHero({
  loading,
  onCreate,
  onRefresh,
  scopeConfig,
  totalCount
}) {
  return (
    <AdminWorkspaceHero
      eyebrow={scopeConfig.workspaceLabel}
      title={`${scopeConfig.scopeLabelPlural} Management`}
      accentClassName={scopeConfig.accent}
      contentClassName="relative z-10 flex flex-col gap-4"
      glowClassName={scopeConfig.heroGlow}
      headerClassName="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      sectionClassName={`rounded-3xl border p-5 md:p-6 ${scopeConfig.heroBackground}`}
      titleClassName="text-2xl font-bold tracking-tight text-slate-900 md:text-[2rem]"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <AdminWorkspaceHeroActionButton
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-700 hover:bg-slate-50"
          >
            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            {loading ? "Refreshing..." : "Refresh"}
          </AdminWorkspaceHeroActionButton>

          {scopeConfig.allowCreate ? (
            <AdminWorkspaceHeroActionButton
              type="button"
              onClick={onCreate}
              className="rounded-xl bg-[#1754cf] px-3.5 py-2.5 text-white shadow-lg shadow-[#1754cf]/20 hover:opacity-90"
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
              {scopeConfig.createButtonLabel}
            </AdminWorkspaceHeroActionButton>
          ) : (
            <div className="rounded-xl border border-[#1754cf]/15 bg-white/90 px-3.5 py-2.5 text-sm font-semibold text-[#1754cf] shadow-sm">
              Edit existing groups only
            </div>
          )}
        </div>
      }
    />
  );
}
