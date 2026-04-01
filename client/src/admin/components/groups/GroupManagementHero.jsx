import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

export default function GroupManagementHero({
  loading,
  onCreate,
  onRefresh,
  stats
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5">
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Group Workspace
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Group Management
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90"
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
              Create Group
            </button>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}
