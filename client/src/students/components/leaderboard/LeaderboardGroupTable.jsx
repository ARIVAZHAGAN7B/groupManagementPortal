import { formatPoints } from "./leaderboard.constants";
import {
  LeaderboardPanel,
  LeaderboardRankBadge,
  LeaderboardStatusBadge,
  LeaderboardTierBadge
} from "./LeaderboardShared";

const LeaderboardGroupTable = ({ pointsColumnLabel, rows }) => (
  <LeaderboardPanel className="hidden lg:block">
    <div className="overflow-auto">
      <table className="min-w-[860px] w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Rank
            </th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Group
            </th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Tier
            </th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Status
            </th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Members
            </th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              {pointsColumnLabel}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={`group-table-${row.group_id || row.group_name || "group"}-${row.rank}`}
              className="hover:bg-slate-50/80"
            >
              <td className="px-5 py-4">
                <LeaderboardRankBadge value={row.rank} />
              </td>
              <td className="px-5 py-4 font-semibold text-slate-900">{row.group_name || "-"}</td>
              <td className="px-5 py-4">
                <LeaderboardTierBadge tier={row.tier} />
              </td>
              <td className="px-5 py-4">
                <LeaderboardStatusBadge status={row.group_status} />
              </td>
              <td className="px-5 py-4 text-slate-600">{row.active_member_count || 0}</td>
              <td className="px-5 py-4 font-bold text-[#1754cf]">
                {formatPoints(row.total_base_points)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </LeaderboardPanel>
);

export default LeaderboardGroupTable;
