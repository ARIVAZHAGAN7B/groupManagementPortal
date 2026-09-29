import React from "react";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { count, dateTime, phaseCountdown, roleLabel } from "./adminDashboard.constants";

export const AdminDashboardHero = React.memo(function AdminDashboardHero({
  adminName,
  navigate,
  nowMs,
  phase,
  profile,
  refreshAll,
  refreshing,
  sourceSummary,
  user
}) {
  // Compute Phase Timeline Progress
  const phaseProgress = React.useMemo(() => {
    if (!phase?.start_date || !phase?.end_date) return null;
    const start = new Date(phase.start_date).getTime();
    const end = new Date(phase.end_date).getTime();
    const totalDuration = end - start;
    if (totalDuration <= 0) return null;
    const elapsed = Math.max(0, nowMs - start);
    const percentage = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.min(totalDays, Math.ceil(elapsed / (1000 * 60 * 60 * 24)));
    return { percentage, totalDays, elapsedDays };
  }, [phase, nowMs]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left Command Narrative */}
        <div className="border-b border-slate-200/80 p-6 md:p-8 xl:border-b-0 xl:border-r dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Administrative Command Center
            </span>
            <span className="text-xs text-slate-400">Live Service Telemetry</span>
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            Welcome back, {adminName}.
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Real-time governance overview across student squads, technical hubs, dynamic tier transitions, and accredited phase milestones.
          </p>

          {/* Phase Progress Bar if active */}
          {phaseProgress && (
            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-950 dark:bg-indigo-950/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900 dark:text-indigo-200">
                  {phase?.phase_name || "Active Cycle"} Timeline
                </span>
                <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                  Day {phaseProgress.elapsedDays} of {phaseProgress.totalDays} ({phaseProgress.percentage}%)
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700"
                  style={{ width: `${phaseProgress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Action Shortcuts */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={refreshAll}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <RefreshRoundedIcon sx={{ fontSize: 16 }} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh Intelligence"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/audit-logs")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-indigo-400"
            >
              Audit Trail
              <ArrowOutwardRoundedIcon sx={{ fontSize: 14 }} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/on-duty-management")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-indigo-400"
            >
              On-Duty Queue
              <ArrowOutwardRoundedIcon sx={{ fontSize: 14 }} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/group-management")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-indigo-400"
            >
              Squads Matrix
              <ArrowOutwardRoundedIcon sx={{ fontSize: 14 }} />
            </button>
          </div>
        </div>

        {/* Right Status Sidebar */}
        <div className="grid content-start gap-0 divide-y divide-slate-100 bg-slate-50/70 dark:divide-slate-800 dark:bg-slate-850/40 md:grid-cols-2 md:divide-x md:divide-y-0 xl:block xl:divide-x-0 xl:divide-y">
          {[
            {
              label: "Operator Identity",
              value: `${roleLabel(profile?.role || user?.role)} • ${profile?.adminId || user?.userId || "Admin"}`
            },
            {
              label: "Clock Synchronization",
              value: dateTime(nowMs)
            },
            {
              label: "Active Evaluation Window",
              value: phase?.phase_name ? `${phase.phase_name} (${phaseCountdown(phase)})` : "No Active Phase"
            },
            {
              label: "Telemetry Feeds",
              value: `${count(sourceSummary?.loaded)}/${count(sourceSummary?.total)} Data Channels Synchronized`
            }
          ].map((item) => (
            <div key={item.label} className="p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.label}</p>
              <p className="mt-1 text-xs font-bold leading-relaxed text-slate-900 dark:text-slate-100">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
