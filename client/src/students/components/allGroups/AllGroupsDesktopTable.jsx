import React from "react";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "./AllGroupsBadge";
import AllGroupsFilters from "./AllGroupsFilters";
import {
  formatEligibilityLabel,
  formatPoints,
  formatRankValue,
  formatVacancyCount
} from "./allGroups.constants";

function SortIndicator({ active = false, direction = null }) {
  if (active && direction === "asc") {
    return <KeyboardArrowUpRoundedIcon sx={{ fontSize: 16 }} />;
  }

  if (active && direction === "desc") {
    return <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />;
  }

  return <UnfoldMoreRoundedIcon sx={{ fontSize: 14 }} className="opacity-50" />;
}

function HeaderSortButton({
  active = false,
  indicator,
  label,
  onClick,
  title
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-bold uppercase tracking-wider transition ${
        active
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      }`}
    >
      <span>{label}</span>
      {indicator}
    </button>
  );
}

const getGroupPoints = (group) => {
  if (group?.total_base_points !== null && group?.total_base_points !== undefined) {
    return formatPoints(group.total_base_points);
  }

  if (group?.total_points !== null && group?.total_points !== undefined) {
    return formatPoints(group.total_points);
  }

  return "-";
};

export default function AllGroupsDesktopTable({
  filterProps,
  onJoin,
  onView,
  resolveJoinAction,
  rows
}) {
  const {
    onCaptainSort,
    onPointsSort,
    onRankSort,
    onTierSort,
    onVacancySort,
    sortState = { key: null, direction: null }
  } = filterProps || {};

  const renderSortIndicator = (key) => (
    <SortIndicator
      active={sortState?.key === key}
      direction={sortState?.key === key ? sortState?.direction : null}
    />
  );

  return (
    <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto overflow-y-visible rounded-2xl">
        <table className="min-w-[1200px] w-full text-xs">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-850">
            <tr>
              <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Squad</th>
              <th className="px-4 py-3 text-left">
                <HeaderSortButton
                  active={sortState?.key === "tier"}
                  label="Tier"
                  title="Sort by tier"
                  indicator={renderSortIndicator("tier")}
                  onClick={onTierSort}
                />
              </th>
              <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Eligibility</th>
              <th className="px-4 py-3 text-left">
                <HeaderSortButton
                  active={sortState?.key === "captainPoints"}
                  label="Captain"
                  title="Sort by captain points"
                  indicator={renderSortIndicator("captainPoints")}
                  onClick={onCaptainSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <HeaderSortButton
                  active={sortState?.key === "rank"}
                  label="Rank"
                  title="Sort by rank"
                  indicator={renderSortIndicator("rank")}
                  onClick={onRankSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <HeaderSortButton
                  active={sortState?.key === "vacancies"}
                  label="Roster & Vacancies"
                  title="Sort by vacancies"
                  indicator={renderSortIndicator("vacancies")}
                  onClick={onVacancySort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <HeaderSortButton
                  active={sortState?.key === "points"}
                  label="Points"
                  title="Sort by group points"
                  indicator={renderSortIndicator("points")}
                  onClick={onPointsSort}
                />
              </th>
              <th className="sticky right-0 z-10 bg-slate-50/90 px-4 py-3 text-right font-bold uppercase tracking-wider dark:bg-slate-850 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((group) => {
              const joinAction = resolveJoinAction(group);
              const vacancies = Number(group.vacancies) || 0;
              const activeMembers = Number(group.active_member_count) || (vacancies > 0 ? Math.max(1, 6 - vacancies) : 6);
              const capacityPct = Math.min(100, Math.round((activeMembers / 6) * 100));

              return (
                <tr
                  key={group.group_id}
                  className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-850/50 cursor-pointer"
                  onClick={() => onView(group.group_id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {group.group_name || `Squad ${group.group_id}`}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                      {group.group_code || `GRP-${String(group.group_id).padStart(3, "0")}`}
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <AllGroupsBadge value={group.tier || "-"} />
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <AllGroupsBadge value={group.status || "Unknown"} />
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {formatEligibilityLabel(group.current_phase_eligibility_status)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {(group.captain_name || "C")[0]}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {group.captain_name || "No Captain"}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      {group.captain_points !== null && group.captain_points !== undefined
                        ? `${formatPoints(group.captain_points)} pts`
                        : "-"}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                    {formatRankValue(group.group_rank)}
                  </td>

                  {/* Vacancy Progress Bar */}
                  <td className="px-4 py-3 min-w-[150px]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {activeMembers}/6 members
                      </span>
                      <span className={`font-bold ${vacancies > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        {vacancies > 0 ? `${vacancies} open` : "Full"}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          capacityPct >= 100 ? "bg-slate-400 dark:bg-slate-600" : "bg-indigo-600"
                        }`}
                        style={{ width: `${capacityPct}%` }}
                      />
                    </div>
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {getGroupPoints(group)}
                  </td>

                  {/* Actions Column */}
                  <td
                    className="sticky right-0 z-[1] bg-white px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-slate-50/80 dark:bg-slate-900 dark:group-hover:bg-slate-850/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(group.group_id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-slate-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-indigo-400 cursor-pointer"
                        title="View squad details"
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onJoin(group)}
                        disabled={joinAction.disabled}
                        title={joinAction.title}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        {joinAction.label}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-xs text-slate-400" colSpan={9}>
                  No squads match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
