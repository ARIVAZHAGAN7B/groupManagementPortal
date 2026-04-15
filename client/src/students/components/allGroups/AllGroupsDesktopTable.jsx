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
    return <KeyboardArrowUpRoundedIcon sx={{ fontSize: 18 }} />;
  }

  if (active && direction === "desc") {
    return <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />;
  }

  return <UnfoldMoreRoundedIcon sx={{ fontSize: 16 }} />;
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
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 transition ${
        active ? "text-[#1754cf]" : "text-current hover:text-slate-800"
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
    <div className="relative hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <AllGroupsFilters {...filterProps} />

      <div className="overflow-x-auto overflow-y-visible rounded-2xl">
        <table className="min-w-[1260px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Group</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderSortButton
                  active={sortState?.key === "tier"}
                  label="Tier"
                  title="Sort by tier"
                  indicator={renderSortIndicator("tier")}
                  onClick={onTierSort}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Eligibility
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderSortButton
                  active={sortState?.key === "captainPoints"}
                  label="Captain"
                  title="Sort by captain points"
                  indicator={renderSortIndicator("captainPoints")}
                  onClick={onCaptainSort}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderSortButton
                  active={sortState?.key === "rank"}
                  label="Rank"
                  title="Sort by rank"
                  indicator={renderSortIndicator("rank")}
                  onClick={onRankSort}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderSortButton
                  active={sortState?.key === "vacancies"}
                  label="Vacancies"
                  title="Sort by vacancies"
                  indicator={renderSortIndicator("vacancies")}
                  onClick={onVacancySort}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderSortButton
                  active={sortState?.key === "points"}
                  label="Points"
                  title="Sort by group points"
                  indicator={renderSortIndicator("points")}
                  onClick={onPointsSort}
                />
              </th>
              <th className="sticky right-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.14)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((group) => {
              const joinAction = resolveJoinAction(group);

              return (
                <tr key={group.group_id} className="group hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{group.group_name || "-"}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {group.group_code || "No code"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AllGroupsBadge value={group.tier || "-"} />
                  </td>
                  <td className="px-4 py-3">
                    <AllGroupsBadge value={group.status || "Unknown"} />
                  </td>
                  <td
                    className="px-4 py-3 font-semibold text-slate-800"
                    title={group.current_phase_eligibility_status || "-"}
                  >
                    {formatEligibilityLabel(group.current_phase_eligibility_status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {group.captain_name || "No Captain"}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {group.captain_name &&
                      group.captain_points !== null &&
                      group.captain_points !== undefined
                        ? `${formatPoints(group.captain_points)} pts`
                        : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {formatRankValue(group.group_rank)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatVacancyCount(group.vacancies)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {getGroupPoints(group)}
                  </td>
                  <td className="sticky right-0 z-[1] bg-white px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-slate-50/80">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onView(group.group_id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                        title="View group"
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onJoin(group)}
                        disabled={joinAction.disabled}
                        title={joinAction.title}
                        className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3 py-1.5 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
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
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={9}>
                  No groups found for the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
