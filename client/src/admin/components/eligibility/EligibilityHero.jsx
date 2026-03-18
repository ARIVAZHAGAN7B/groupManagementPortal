import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  formatPercentLabel,
  getPhaseLabel,
  getPhaseStatusPillClass,
  getViewLabel
} from "./eligibility.constants";

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

export default function EligibilityHero({
  filteredCount,
  loading,
  onRefresh,
  phase,
  stats,
  viewMode
}) {
  const total = Number(stats?.total) || 0;
  const eligible = Number(stats?.eligible) || 0;
  const notEligible = Number(stats?.notEligible) || 0;
  const overrides = Number(stats?.overrides) || 0;
  const viewLabel = getViewLabel(viewMode);

  const headerSummary =
    typeof filteredCount === "number" && filteredCount !== total
      ? `Showing ${filteredCount} of ${total} ${viewLabel}`
      : `${total} ${viewLabel} in workspace`;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5">
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Eligibility Workspace
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Eligibility Management
              </h1>
              {phase ? (
                <span className="rounded-full border border-[#1754cf]/15 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1754cf]">
                  {getPhaseLabel(phase)}
                </span>
              ) : null}
              {phase?.status ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getPhaseStatusPillClass(
                    phase.status
                  )}`}
                >
                  {phase.status}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600">{headerSummary}</p>
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
            detail={phase ? getPhaseLabel(phase) : "No phase selected"}
            label="Total"
            value={total}
          />
          <StatPill
            accentClass="bg-green-500"
            detail={formatPercentLabel(eligible, total)}
            label="Eligible"
            value={eligible}
          />
          <StatPill
            accentClass="bg-red-400"
            detail={formatPercentLabel(notEligible, total)}
            label="Not Eligible"
            value={notEligible}
          />
          <StatPill
            accentClass="bg-amber-500"
            detail="Reason code contains OVERRIDE"
            label="Overrides"
            value={overrides}
          />
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}
