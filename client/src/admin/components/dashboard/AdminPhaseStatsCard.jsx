import React from "react";
import { MiniStat, SectionCard, StatusBadge } from "./AdminDashboardPrimitives";
import {
  count,
  formatPercent,
  num,
  phaseCountdown,
  shortDate
} from "./adminDashboard.constants";

export const AdminPhaseStatsCard = React.memo(function AdminPhaseStatsCard({
  currentPhaseId,
  dashboard,
  data,
  navigate,
  phase
}) {
  return (
    <SectionCard
      title="Phase Statistics"
      subtitle="Current phase eligibility and overall phase coverage."
      actionLabel="Open phase history"
      onAction={() => navigate("/phase-history")}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MiniStat
          label="Total Phases"
          note="Historical and current phases."
          value={count(data.phases.length)}
        />
        <MiniStat
          label="Active Phases"
          note="Phases currently marked active."
          value={count(dashboard.phaseStatusCounts.ACTIVE)}
        />
        <MiniStat
          label="Current Phase"
          note={phase?.phase_id ? `${shortDate(phase.start_date)} - ${shortDate(phase.end_date)}` : "No active phase"}
          value={phase?.phase_name || "Unavailable"}
        />
      </div>

      <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {phase?.phase_name || "No active phase"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {phase?.phase_id
                ? `${shortDate(phase.start_date)} - ${shortDate(phase.end_date)}`
                : "Eligibility counts appear when a phase is active."}
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#1754cf]">
            {phaseCountdown(phase)}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-800">Scheduled progress</span>
            <span className="font-bold text-slate-900">
              {formatPercent(dashboard.phaseProgressValue)}
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#1754cf]"
              style={{ width: `${num(dashboard.phaseProgressValue) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MiniStat
          label="Eligible Groups"
          note="Current phase group eligibility snapshot."
          value={currentPhaseId ? count(dashboard.eligibleGroups) : "N/A"}
        />
        <MiniStat
          label="Ineligible Groups"
          note="Groups currently below phase requirements."
          value={currentPhaseId ? count(dashboard.ineligibleGroups) : "N/A"}
        />
        <MiniStat
          label="Eligible Students"
          note="Students meeting current phase requirements."
          value={currentPhaseId ? count(dashboard.eligibleStudents) : "N/A"}
        />
        <MiniStat
          label="Ineligible Students"
          note="Students currently below phase requirements."
          value={currentPhaseId ? count(dashboard.ineligibleStudents) : "N/A"}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge label="Active" statusKey="ACTIVE" value={dashboard.phaseStatusCounts.ACTIVE} />
        <StatusBadge
          label="Inactive"
          statusKey="INACTIVE"
          value={dashboard.phaseStatusCounts.INACTIVE}
        />
      </div>
    </SectionCard>
  );
});
