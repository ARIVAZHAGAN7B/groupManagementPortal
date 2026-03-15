import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

function TeamPageHeroStatPill({ accentClass, detail, label, value }) {
  return (
    <article className="rounded-lg border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${accentClass}`} />
        <p className="text-sm font-semibold leading-5 text-slate-700">
          {label}: <span className="break-words text-slate-900">{value ?? "-"}</span>
        </p>
      </div>
      {detail ? (
        <p className="mt-1 pl-4 text-[11px] font-medium text-slate-500">{detail}</p>
      ) : null}
    </article>
  );
}

export default function TeamPageHero({
  loading = false,
  onRefresh,
  eyebrow = "Team Workspace",
  title,
  summary,
  description,
  actionLabel = "Refresh",
  actionBusyLabel = "Refreshing...",
  stats = []
}) {
  const visibleStats = Array.isArray(stats) ? stats.filter(Boolean) : [];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5">
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="min-w-0">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              {eyebrow}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {summary ? (
              <p className="mt-1 text-xs font-medium text-slate-600">{summary}</p>
            ) : null}
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
            ) : null}
          </div>

          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              {loading ? actionBusyLabel : actionLabel}
            </button>
          ) : null}
        </div>

        {visibleStats.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {visibleStats.map((stat) => (
              <TeamPageHeroStatPill
                key={stat.key || stat.label}
                accentClass={stat.accentClass || "bg-[#1754cf]"}
                detail={stat.detail}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}
