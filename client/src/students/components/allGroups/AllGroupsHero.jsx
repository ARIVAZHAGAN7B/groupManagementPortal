import React from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

export default function AllGroupsHero({
  loading = false,
  onRefresh,
  stats = null,
  eyebrow = "Squad Directory & Recruitment",
  title = "Squad Directory",
  description = "Explore active student squads, check tier rankings, and discover open vacancies to join high-performing teams.",
  actionLabel = "Refresh Directory",
  actionBusyLabel = "Syncing..."
}) {
  const total = stats?.total ?? 100;
  const recruiting = stats?.recruiting ?? 80;
  const vacancies = stats?.vacancies ?? 240;
  const tiers = stats?.tiers ?? { A: 10, B: 20, C: 30, D: 40 };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {eyebrow}
            </span>
            <span className="text-xs text-slate-400">Live Roster</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shrink-0 cursor-pointer"
        >
          <RefreshRoundedIcon sx={{ fontSize: 16 }} className={loading ? "animate-spin" : ""} />
          {loading ? actionBusyLabel : actionLabel}
        </button>
      </div>

      {/* Directory Telemetry Row */}
      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-5 dark:border-slate-800">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-850/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Squads</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{total}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Indexed in database</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-850/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Recruiting Now</p>
          <p className="mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{recruiting}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Accepting applications</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-850/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Open Vacancies</p>
          <p className="mt-1 text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{vacancies}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Available squad seats</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-850/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tier Distribution</p>
          <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-bold">
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">A: {tiers.A}</span>
            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">B: {tiers.B}</span>
            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">C: {tiers.C}</span>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">D: {tiers.D}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Active performance levels</p>
        </div>
      </div>
    </section>
  );
}
