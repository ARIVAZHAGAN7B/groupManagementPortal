import ChangeDayManagementSectionShell from "./ChangeDayManagementSectionShell";

export default function ChangeDayManagementTargetsSection({
  individualTarget,
  onSave,
  onTargetChange,
  saving,
  setIndividualTarget,
  targets
}) {
  return (
    <ChangeDayManagementSectionShell
      title="Update Targets"
      description="Configure individual and tier-based performance targets for this phase."
      border={false}
      action={
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-[#1754cf] px-6 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_rgba(23,84,207,0.22)] transition-all hover:bg-[#154ab4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {saving ? "Saving..." : "Save Targets"}
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {targets.map((row) => (
          <label
            key={row.tier}
            className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Tier {row.tier}
            </span>
            <input
              type="number"
              min={0}
              value={row.group_target}
              onChange={(e) => onTargetChange(row.tier, e.target.value)}
              className="w-full border-none bg-transparent p-0 text-lg font-bold text-slate-900 outline-none focus:ring-0"
            />
          </label>
        ))}
      </div>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Individual Target (All Students)
        </span>
        <div className="relative">
          <input
            type="number"
            min={0}
            value={individualTarget}
            onChange={(e) => setIndividualTarget(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-2xl font-black text-slate-900 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10"
          />
          <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            Units
          </span>
        </div>
      </label>
    </ChangeDayManagementSectionShell>
  );
}
