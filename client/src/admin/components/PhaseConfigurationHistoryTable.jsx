import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import {
  formatPhaseDateRange,
  formatStatusLabel,
  getPhaseWorkingDaysLabel,
  getStatusBadgeClass,
  getTargetSummaryItems
} from "./PhaseConfigurationUtils";

function PhaseHistoryEmptyRow() {
  return (
    <tr>
      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
        No phases found.
      </td>
    </tr>
  );
}

function PhaseHistoryRow({ phase }) {
  const targetItems = getTargetSummaryItems(phase);

  return (
    <tr className="transition-colors hover:bg-slate-50/80">
      <td className="px-6 py-4">
        <div className="font-bold text-slate-900">
          {phase?.phase_name || phase?.phase_id || "Unnamed Phase"}
        </div>
        <div className="mt-1 text-[10px] font-medium text-slate-400">{phase?.phase_id || "-"}</div>
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${getStatusBadgeClass(
            phase?.status
          )}`}
        >
          {formatStatusLabel(phase?.status)}
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="text-xs font-semibold text-slate-700">{formatPhaseDateRange(phase)}</div>
      </td>

      <td className="px-6 py-4 text-xs font-bold text-slate-600">
        {getPhaseWorkingDaysLabel(phase)}
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1.5">
          {targetItems.length > 0 ? (
            targetItems.map((item) => (
              <span
                key={`${phase?.phase_id || "phase"}-${item.label}`}
                className={
                  item.accent
                    ? "rounded bg-[#1754cf]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#1754cf]"
                    : "rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700"
                }
              >
                <span className={item.accent ? "mr-1 text-[#1754cf]/60" : "mr-1 text-slate-400"}>
                  {item.label}:
                </span>
                {item.value}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">No targets</span>
          )}
        </div>
      </td>

      <td className="px-6 py-4 text-right">
        <button
          type="button"
          disabled
          aria-label="Phase row actions unavailable"
          className="text-[#1754cf] disabled:cursor-default disabled:opacity-100"
        >
          <MoreVertRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </td>
    </tr>
  );
}

export default function PhaseConfigurationHistoryTable({ recentPhases }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Last 5 Phases</h2>
        <span className="text-xs font-medium text-slate-400">Showing recent activity</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Phase Name &amp; ID
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Start/End Dates
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Working Days
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Targets Summary
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {recentPhases.length > 0 ? (
              recentPhases.map((phase) => (
                <PhaseHistoryRow key={phase.phase_id || phase.phase_name} phase={phase} />
              ))
            ) : (
              <PhaseHistoryEmptyRow />
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
