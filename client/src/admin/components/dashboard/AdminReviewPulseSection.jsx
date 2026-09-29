import React from "react";
import { MiniStat, SectionCard } from "./AdminDashboardPrimitives";
import { cn, count, formatPercent, num, phaseCountdown } from "./adminDashboard.constants";

export const AdminReviewPulseSection = React.memo(function AdminReviewPulseSection({
  dashboard,
  notices = [],
  phase,
  sourceSummary
}) {
  return (
    <>
      {notices.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {notices.join(" ")}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Review Queue" subtitle="Leadership, tier, and on-duty approvals.">
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Leadership" note="Pending" value={count(dashboard.pendingLeadership)} />
            <MiniStat label="Tier" note="Pending" value={count(dashboard.pendingTier)} />
            <MiniStat label="On-Duty" note="Pending" value={count(dashboard.pendingOd)} />
          </div>
        </SectionCard>

        <SectionCard title="Phase Pulse" subtitle={phase?.phase_name || "No active phase"}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-950">
                {formatPercent(dashboard.phaseProgressValue)}
              </p>
              <p className="mt-1 text-sm text-slate-600">{phaseCountdown(phase)}</p>
            </div>
            <div className="h-2 w-36 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#1754cf]"
                style={{ width: `${num(dashboard.phaseProgressValue) * 100}%` }}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Source Health" subtitle="Dashboard data availability.">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-950">
                {count(sourceSummary?.loaded)}/{count(sourceSummary?.total)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {sourceSummary?.failed?.length ? sourceSummary.failed.join(", ") : "All tracked sources loaded."}
              </p>
            </div>
            <span
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-semibold",
                sourceSummary?.failed?.length
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
            >
              {sourceSummary?.failed?.length ? "Partial" : "Live"}
            </span>
          </div>
        </SectionCard>
      </div>
    </>
  );
});
