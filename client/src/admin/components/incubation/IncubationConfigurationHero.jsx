import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

export default function IncubationConfigurationHero({
  canSave,
  dirty,
  loading,
  onRefresh,
  onSave,
  saving
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-3.5 md:p-4">
      <div className="relative z-10 flex flex-col gap-2.5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
             Policy Workspace
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                Incubation Configuration
              </h1>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                  dirty
                    ? "border border-amber-200 bg-amber-50 text-amber-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {dirty ? "Draft changes" : "Synced"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70 sm:text-sm"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={saving || !canSave || !dirty}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:text-sm"
            >
              <SaveRoundedIcon sx={{ fontSize: 18 }} />
              {saving ? "Saving..." : dirty ? "Save Changes" : "Saved"}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}
