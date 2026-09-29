import React from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

export default function LeadershipManagementHero({
  loading,
  onRefresh,
  stats
}) {
  const total = stats?.total ?? 0;
  const uniqueGroups = stats?.uniqueGroups ?? 0;
  const withoutLeadership = stats?.withoutLeadership ?? 0;
  const captainRequests = stats?.captainRequests ?? 0;
  const viceCaptainRequests = stats?.viceCaptainRequests ?? 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Leadership Governance
            </span>
            <span className="text-xs text-slate-400">Review & Approvals</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Leadership Requests
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Review and adjudicate student applications for squad leadership, captaincy promotions, and vacant leadership roles.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shrink-0 cursor-pointer"
        >
          <RefreshRoundedIcon sx={{ fontSize: 16 }} className={loading ? "animate-spin" : ""} />
          {loading ? "Syncing..." : "Refresh Queue"}
        </button>
      </div>

      {/* Telemetry Row */}
      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-5 dark:border-slate-800">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-850/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pending Requests</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{total}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Awaiting admin review</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-850/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Impacted Squads</p>
          <p className="mt-1 text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{uniqueGroups}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Unique squads requesting</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-850/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Needs Leadership</p>
          <p className={`mt-1 text-xl font-extrabold ${withoutLeadership > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {withoutLeadership}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Squads missing captains</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-850/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Role Breakdown</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-white">
              👑 {captainRequests}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-300">
              🛡️ {viceCaptainRequests}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Captains vs Vice Captains</p>
        </div>
      </div>
    </section>
  );
}
