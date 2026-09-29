import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import ChangeDayManagementSectionShell from "./ChangeDayManagementSectionShell";

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";

export default function ChangeDayManagementTargetsSection({
  individualTarget,
  onSave,
  onTargetChange,
  saving,
  setIndividualTarget,
  targets
}) {
  const configuredTargetCount = targets.filter((row) => hasValue(row?.group_target)).length;
  const totalGroupTarget = targets.reduce((total, row) => {
    if (!hasValue(row?.group_target)) return total;
    const numericValue = Number(row.group_target);
    return Number.isFinite(numericValue) ? total + numericValue : total;
  }, 0);

  return (
    <ChangeDayManagementSectionShell
      eyebrow="Step 3"
      icon={FlagRoundedIcon}
      title="Calibrate Targets"
      aside={
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Tier Targets Ready
            </p>
            <p className="mt-2 text-base font-black text-slate-900">
              {configuredTargetCount}/{targets.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Total Group Units
            </p>
            <p className="mt-2 text-base font-black text-slate-900">{totalGroupTarget}</p>
          </div>

          <div className="rounded-2xl border border-white bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Individual Target
            </p>
            <p className="mt-2 text-base font-black text-slate-900">
              {hasValue(individualTarget) ? individualTarget : "Not set"}
            </p>
          </div>
        </div>
      }
      action={
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-2xl bg-[#1754cf] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(23,84,207,0.22)] transition-all hover:bg-[#154ab4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {saving ? "Saving..." : "Save Targets"}
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {targets.map((row) => (
          <label
            key={row.tier}
            className="space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4"
          >
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Tier {row.tier}
            </span>
            <input
              type="number"
              min={0}
              value={row.group_target}
              onChange={(e) => onTargetChange(row.tier, e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-2xl font-black text-slate-900 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10"
            />
          </label>
        ))}

        <label className="space-y-3 rounded-2xl border border-slate-200 bg-[#1754cf]/5 p-5 md:col-span-2 xl:col-span-1">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#1754cf]">
            Individual Target
          </span>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={individualTarget}
              onChange={(e) => setIndividualTarget(e.target.value)}
              className="w-full rounded-2xl border border-white bg-white px-5 py-4 pr-20 text-3xl font-black text-slate-900 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10"
            />
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
              Units
            </span>
          </div>
        </label>
      </div>
    </ChangeDayManagementSectionShell>
  );
}
