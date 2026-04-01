import { formatPoints } from "./leaderboard.constants";
import {
  LeaderboardPanel,
  LeaderboardRankBadge,
  LeaderboardTierBadge
} from "./LeaderboardShared";

const LeaderboardStudentTable = ({ pointsColumnLabel, rows }) => (
  <LeaderboardPanel className="hidden lg:block">
    <div className="overflow-auto">
      <table className="min-w-[980px] w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Rank
            </th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Student
            </th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Department
            </th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Year
            </th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Group
            </th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              {pointsColumnLabel}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={`table-${row.student_id || row.name || "student"}-${row.rank}`}
              className="hover:bg-slate-50/80"
            >
              <td className="px-5 py-4">
                <LeaderboardRankBadge value={row.rank} />
              </td>
              <td className="px-5 py-4">
                <div className="font-semibold text-slate-900">{row.name || "-"}</div>
                <div className="mt-1 text-xs font-medium text-slate-500">{row.student_id || "-"}</div>
              </td>
              <td className="px-5 py-4 text-slate-600">{row.department || "-"}</td>
              <td className="px-5 py-4 text-slate-600">{row.year ?? "-"}</td>
              <td className="px-5 py-4">
                {row.group_name ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{row.group_name || "-"}</span>
                    <LeaderboardTierBadge tier={row.group_tier} />
                  </div>
                ) : (
                  <span className="text-slate-500">No group</span>
                )}
              </td>
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

export default LeaderboardStudentTable;
