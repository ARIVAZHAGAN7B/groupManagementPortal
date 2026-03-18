export default function IncubationConfigurationToggleCard({
  checked,
  label,
  onChange
}) {
  return (
    <label
      className={`flex rounded-2xl border p-3.5 shadow-sm transition ${
        checked
          ? "border-[#1754cf]/15 bg-[#1754cf]/5"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />

      <div className="flex w-full items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
                checked
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {checked ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        <span
          className={`relative mt-0.5 inline-flex h-5 w-10 shrink-0 rounded-full transition ${
            checked ? "bg-[#1754cf]" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              checked ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </span>
      </div>
    </label>
  );
}
