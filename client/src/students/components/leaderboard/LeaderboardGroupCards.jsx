import { formatPoints } from "./leaderboard.constants";
import {
  LeaderboardPanel,
  LeaderboardRankBadge,
  LeaderboardStatusBadge,
  LeaderboardTierBadge
} from "./LeaderboardShared";

const LeaderboardGroupCards = ({ pointsColumnLabel, rows }) => (
  <div className="grid grid-cols-1 gap-3 lg:hidden">
    {rows.map((row) => (
      <LeaderboardPanel
        key={`group-card-${row.group_id || row.group_name || "group"}-${row.rank}`}
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
          <p className="text-lg font-bold text-slate-900">{row.group_name || "-"}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <LeaderboardTierBadge tier={row.tier} />
          <LeaderboardStatusBadge status={row.group_status} />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Active Members
          </p>
          <p className="mt-2 text-lg font-bold text-slate-900">{row.active_member_count || 0}</p>
        </div>
      </LeaderboardPanel>
    ))}
  </div>
);

export default LeaderboardGroupCards;
