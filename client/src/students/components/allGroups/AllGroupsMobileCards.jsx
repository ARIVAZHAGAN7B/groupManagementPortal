import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "./AllGroupsBadge";
import AllGroupsFilters from "./AllGroupsFilters";
import {
  formatEligibilityLabel,
  formatPoints,
  formatRankValue,
  formatVacancyCount,
} from "./allGroups.constants";

function Detail({ label, subtext = null, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
      {subtext ? <div className="mt-1 text-xs text-slate-500">{subtext}</div> : null}
    </div>
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

export default function AllGroupsMobileCards({
  filterProps,
  onJoin,
  onView,
  resolveJoinAction,
  rows
}) {
  return (
    <div className="space-y-3 lg:hidden">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <AllGroupsFilters {...filterProps} withDivider={false} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
          No groups found for the current filters.
        </div>
      ) : null}

      {rows.map((group) => (
        (() => {
          const joinAction = resolveJoinAction(group);

          return (
            <article
              key={group.group_id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-slate-900">
                  {group.group_name || "-"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">{group.group_code || "No code"}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <AllGroupsBadge value={group.tier || "-"} />
                <AllGroupsBadge value={group.status || "Unknown"} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Detail
                  label="Eligibility"
                  value={formatEligibilityLabel(group.current_phase_eligibility_status)}
                />
                <Detail
                  label="Captain"
                  value={group.captain_name || "No Captain"}
                  subtext={
                    group.captain_name &&
                    group.captain_points !== null &&
                    group.captain_points !== undefined
                      ? `${formatPoints(group.captain_points)} pts`
                      : "-"
                  }
                />
                <Detail
                  label="Rank"
                  value={formatRankValue(group.group_rank)}
                />
                <Detail label="Vacancies" value={formatVacancyCount(group.vacancies)} />
                <Detail label="Points" value={getGroupPoints(group)} />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onView(group.group_id)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  title="View group"
                >
                  <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                </button>
                <button
                  type="button"
                  onClick={() => onJoin(group)}
                  disabled={joinAction.disabled}
                  title={joinAction.title}
                  className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3.5 py-2 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {joinAction.label}
                </button>
              </div>
            </article>
          );
        })()
      ))}
    </div>
  );
}
