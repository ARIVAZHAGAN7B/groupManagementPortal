import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

export default function TeamManagementHero({
  loading,
  onCreate,
  onRefresh,
  scopeConfig,
  totalCount
}) {
  return (
    <section className={`relative overflow-hidden rounded-3xl border p-5 md:p-6 ${scopeConfig.heroBackground}`}>
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <span className={`mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] ${scopeConfig.accent}`}>
              {scopeConfig.workspaceLabel}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[2rem]">
              {scopeConfig.scopeLabelPlural} Management
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            {scopeConfig.allowCreate ? (
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1754cf] px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90"
              >
                <AddRoundedIcon sx={{ fontSize: 18 }} />
                {scopeConfig.createButtonLabel}
              </button>
            ) : (
              <div className="rounded-xl border border-[#1754cf]/15 bg-white/90 px-3.5 py-2.5 text-sm font-semibold text-[#1754cf] shadow-sm">
                Edit existing groups only
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`absolute -bottom-12 -right-10 h-56 w-56 rounded-full blur-3xl ${scopeConfig.heroGlow}`} />
    </section>
  );
}
