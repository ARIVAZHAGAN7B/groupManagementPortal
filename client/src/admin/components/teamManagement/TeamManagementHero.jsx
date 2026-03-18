import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

function StatPill({ accentClass, detail, label, value }) {
  return (
    <article className="rounded-xl border border-white/80 bg-white/90 px-3 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${accentClass}`} />
        <p className="text-sm font-semibold text-slate-700">
          {label}: <span className="text-slate-900">{value}</span>
        </p>
      </div>
      {detail ? <p className="mt-1 pl-4 text-[11px] font-medium text-slate-500">{detail}</p> : null}
    </article>
  );
}

export default function TeamManagementHero({
  filteredCount,
  loading,
  onCreate,
  onRefresh,
  scopeConfig,
  statCards,
  totalCount
}) {
  const headerSummary =
    typeof filteredCount === "number" && filteredCount !== totalCount
      ? `Showing ${filteredCount} of ${totalCount} ${scopeConfig.scopeLabelPlural.toLowerCase()}`
      : `${totalCount} ${scopeConfig.scopeLabelPlural.toLowerCase()} in workspace`;

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
            <p className="mt-2 text-xs font-semibold text-slate-500">{headerSummary}</p>
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
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f6cbd] px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0f6cbd]/20 transition-opacity hover:opacity-90"
              >
                <AddRoundedIcon sx={{ fontSize: 18 }} />
                {scopeConfig.createButtonLabel}
              </button>
            ) : (
              <div className="rounded-xl border border-orange-200 bg-white/90 px-3.5 py-2.5 text-sm font-semibold text-orange-700 shadow-sm">
                Edit existing groups only
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatPill
              key={card.label}
              accentClass={card.accentClass}
              detail={card.detail}
              label={card.label}
              value={card.value}
            />
          ))}
        </div>
      </div>

      <div className={`absolute -bottom-12 -right-10 h-56 w-56 rounded-full blur-3xl ${scopeConfig.heroGlow}`} />
    </section>
  );
}
