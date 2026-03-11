const cardInputClass =
  "w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1754cf] focus:ring-3 focus:ring-[#1754cf]/10";

export default function PhaseConfigurationTargetsCard({
  individualTarget,
  onSaveTargets,
  onTargetChange,
  phase,
  setIndividualTarget,
  targets,
  targetsLoading
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-base font-bold text-slate-900">Set Targets</h2>
        <button
          type="button"
          onClick={onSaveTargets}
          disabled={!phase?.phase_id || targetsLoading}
          className="rounded-md bg-[#1754cf]/10 px-4 py-1.5 text-xs font-bold text-[#1754cf] transition-all hover:bg-[#1754cf]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {targetsLoading ? "Saving..." : "Save Targets"}
        </button>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
          {targets.map((row) => (
            <label
              key={row.tier}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2.5 text-center"
            >
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Tier {row.tier}
              </span>
              <input
                type="number"
                min={0}
                value={row.group_target}
                onChange={(e) => onTargetChange(row.tier, e.target.value)}
                className="w-full border-none bg-transparent p-0 text-center text-base font-bold text-slate-900 outline-none focus:ring-0"
              />
            </label>
          ))}

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Individual Target
            </span>
            <input
              type="number"
              min={0}
              value={individualTarget}
              onChange={(e) => setIndividualTarget(e.target.value)}
              className={`${cardInputClass} text-center text-base font-bold`}
              placeholder="0"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
