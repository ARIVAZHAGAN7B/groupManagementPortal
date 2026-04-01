import { formatPoints } from "./leaderboard.constants";
import {
  LeaderboardPanel,
  LeaderboardRankBadge,
  LeaderboardTierBadge
} from "./LeaderboardShared";

const LeaderboardStudentCards = ({ pointsColumnLabel, rows }) => (
  <div className="grid grid-cols-1 gap-3 lg:hidden">
    {rows.map((row) => (
      <LeaderboardPanel
        key={`card-${row.student_id || row.name || "student"}-${row.rank}`}
        className="p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <LeaderboardRankBadge value={row.rank} />
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {pointsColumnLabel}
            </p>
            <p className="mt-1 text-xl font-bold text-[#1754cf]">
              {formatPoints(row.total_base_points)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-lg font-bold text-slate-900">{row.name || "-"}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{row.student_id || "-"}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {row.department || "-"}
          </span>
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Year {row.year ?? "-"}
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Group
          </p>
          {row.group_name ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{row.group_name || "-"}</span>
              <LeaderboardTierBadge tier={row.group_tier} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No group</p>
          )}
        </div>
      </LeaderboardPanel>
    ))}
  </div>
);

export default LeaderboardStudentCards;
