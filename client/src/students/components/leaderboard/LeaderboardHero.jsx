import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

const LeaderboardHero = ({ limit, loading, onRefresh }) => {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5">
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Student Workspace
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leaderboard</h1>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1754cf]/15 bg-white/90 px-3 py-1 text-xs font-semibold text-[#1754cf]">
                <WorkspacePremiumRoundedIcon sx={{ fontSize: 16 }} />
                Top {limit}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Track the strongest performers across individual, leader, and group rankings with a
              cleaner view of points, group placement, and academic context.
            </p>
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
      </div>

      <div className="absolute -bottom-12 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
};

export default LeaderboardHero;
