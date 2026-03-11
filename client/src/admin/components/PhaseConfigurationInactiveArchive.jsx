import {
  formatStatusLabel,
  getInactiveArchiveMeta,
  getStatusBadgeClass
} from "./PhaseConfigurationUtils";

function EmptyArchiveState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
      No additional inactive phases outside the recent 5.
    </div>
  );
}

function InactiveArchiveCard({ phase }) {
  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="truncate font-bold text-slate-900">
            {phase?.phase_name || phase?.phase_id || "Unnamed Phase"}
          </h4>
          <p className="mt-1 truncate text-xs text-slate-400">ID: {phase?.phase_id || "-"}</p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${getStatusBadgeClass(
            phase?.status
          )}`}
        >
          {formatStatusLabel(phase?.status)}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
        <span className="text-slate-500">{getInactiveArchiveMeta(phase)}</span>
        <button
          type="button"
          disabled
          className="font-bold text-[#1754cf] disabled:cursor-default disabled:opacity-100"
        >
          Details
        </button>
      </div>
    </article>
  );
}

export default function PhaseConfigurationInactiveArchive({ additionalInactivePhases }) {
  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Additional Inactive Phases
        </h2>
        <button
          type="button"
          disabled
          className="text-sm font-bold text-[#1754cf] disabled:cursor-default disabled:opacity-100"
        >
          View Archive
        </button>
      </div>

      {additionalInactivePhases.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {additionalInactivePhases.map((phase) => (
            <InactiveArchiveCard key={phase.phase_id || phase.phase_name} phase={phase} />
          ))}
        </div>
      ) : (
        <EmptyArchiveState />
      )}
    </section>
  );
}
