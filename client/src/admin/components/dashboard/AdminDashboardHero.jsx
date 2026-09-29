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
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="border-b border-slate-200 p-5 md:p-6 xl:border-b-0 xl:border-r">
          <p className="text-[11px] font-bold uppercase text-[#1754cf]">
            Admin Statistics Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            {adminName}, live service intelligence.
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Realtime service visibility across groups, phases, teams, hubs, events, student
            activity, and operational alerts.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={refreshAll}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              {refreshing ? "Refreshing..." : "Refresh statistics"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/audit-logs")}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:text-[#1754cf]"
            >
              Open audit logs
              <ArrowOutwardRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        <div className="grid content-start gap-0 divide-y divide-slate-200 bg-slate-50/70 md:grid-cols-2 md:divide-x md:divide-y-0 xl:block xl:divide-x-0 xl:divide-y">
          {[
            {
              label: "Admin",
              value: `${roleLabel(profile?.role || user?.role)} | ${
                profile?.adminId || user?.userId || "Unavailable"
              }`
            },
            {
              label: "Live Now",
              value: dateTime(nowMs)
            },
            {
              label: "Current Phase",
              value: phase?.phase_name ? `${phase.phase_name} | ${phaseCountdown(phase)}` : "No active phase"
            },
            {
              label: "Source Health",
              value: `${count(sourceSummary?.loaded)}/${count(sourceSummary?.total)} data sources live`
            }
          ].map((item) => (
            <div key={item.label} className="px-4 py-4">
              <p className="text-[10px] font-bold uppercase text-slate-500">{item.label}</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
