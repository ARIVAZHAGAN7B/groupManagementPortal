import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { formatDate, formatNumber } from "./studentManagement.constants";

function StatPill({ accentClass, detail, label, value }) {
  return (
    <article className="rounded-lg border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${accentClass}`} />
        <p className="text-sm font-semibold text-slate-700">
          {label}: <span className="text-slate-900">{value}</span>
        </p>
      </div>
      <p className="mt-1 pl-4 text-[11px] font-medium text-slate-500">{detail}</p>
    </article>
  );
}

export default function StudentManagementHero({
  filteredCount,
  loading,
  onRefresh,
  phase,
  stats
}) {
  const total = Number(stats?.totalStudents) || 0;
  const inGroup = Number(stats?.inGroup) || 0;
  const ungrouped = Number(stats?.ungrouped) || 0;
  const totalBasePoints = Number(stats?.totalBasePoints) || 0;
  const totalPhasePoints = Number(stats?.totalPhasePoints) || 0;

  const headerSummary =
    typeof filteredCount === "number" && filteredCount !== total
      ? `Showing ${filteredCount} of ${total} students`
      : `${total} students in workspace`;

  const phaseSummary = phase?.phase_id
    ? `Active phase: ${formatDate(phase.start_date)} to ${formatDate(phase.end_date)}`
    : "No active phase";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5">
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Student Workspace
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Student Management
              </h1>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600">{headerSummary}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">{phaseSummary}</p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
          >
            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatPill
            accentClass="bg-[#1754cf]"
            detail={`${ungrouped} ungrouped`}
            label="Total"
            value={total}
          />
          <StatPill
            accentClass="bg-emerald-500"
            detail={`${total > 0 ? Math.round((inGroup / total) * 100) : 0}% in groups`}
            label="In Groups"
            value={inGroup}
          />
          <StatPill
            accentClass="bg-amber-500"
            detail="Total recorded points"
            label="Base Points"
            value={formatNumber(totalBasePoints)}
          />
          <StatPill
            accentClass="bg-sky-500"
            detail={phase?.phase_id ? "Current phase total" : "No active phase"}
            label="Phase Points"
            value={formatNumber(totalPhasePoints)}
          />
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}
