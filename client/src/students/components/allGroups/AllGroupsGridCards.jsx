import React from "react";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "./AllGroupsBadge";
import { formatPoints, formatRankValue, formatVacancyCount } from "./allGroups.constants";

const getTierColor = (tier) => {
  switch (String(tier || "").toUpperCase()) {
    case "A":
      return "border-amber-400/40 bg-amber-500/5 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-300";
    case "B":
      return "border-purple-400/40 bg-purple-500/5 text-purple-700 dark:border-purple-500/30 dark:bg-purple-950/20 dark:text-purple-300";
    case "C":
      return "border-sky-400/40 bg-sky-500/5 text-sky-700 dark:border-sky-500/30 dark:bg-sky-950/20 dark:text-sky-300";
    default:
      return "border-emerald-400/40 bg-emerald-500/5 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-300";
  }
};

export default function AllGroupsGridCards({
  onJoin,
  onView,
  resolveJoinAction,
  rows = []
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <p className="text-base font-semibold">No squads match your current filter criteria.</p>
        <p className="mt-1 text-xs">Try resetting or broadening your search parameters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((group) => {
        const joinAction = resolveJoinAction(group);
        const vacancies = Number(group.vacancies) || 0;
        const activeMembers = Number(group.active_member_count) || (vacancies > 0 ? Math.max(1, 6 - vacancies) : 6);
        const maxCapacity = 6;
        const capacityPercentage = Math.min(100, Math.round((activeMembers / maxCapacity) * 100));
        const isAccepting = group.status === "ACTIVE" && (group.accepting_applications === 1 || group.accepting_applications === true);

        return (
          <div
            key={group.group_id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            {/* Top Bar: Tier Badge, Code & Status */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold ${getTierColor(group.tier)}`}>
                    Tier {group.tier || "D"}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-400">
                    {group.group_code || `GRP-${String(group.group_id).padStart(3, "0")}`}
                  </span>
                </div>

                {isAccepting ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Recruiting
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {group.status || "Full"}
                  </span>
                )}
              </div>

              {/* Group Name & Condition */}
              <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors">
                {group.group_name || `Squad ${group.group_id}`}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[32px]">
                {group.joining_conditions || "Standard enrollment open for collaborative members."}
              </p>

              {/* Key Stats Chips */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-850/60">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Captain</span>
                  <div className="mt-0.5 flex items-center gap-1.5 truncate">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {(group.captain_name || "C")[0]}
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {group.captain_name || "Unassigned"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Points & Rank</span>
                  <div className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {group.total_base_points || group.total_points ? `${formatPoints(group.total_base_points || group.total_points)} pts` : "-"}
                    {group.group_rank ? ` • #${group.group_rank}` : ""}
                  </div>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Squad Roster</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {activeMembers} / {maxCapacity} ({vacancies > 0 ? `${vacancies} open` : "Full"})
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      capacityPercentage >= 100
                        ? "bg-slate-400 dark:bg-slate-600"
                        : "bg-gradient-to-r from-indigo-500 to-indigo-600"
                    }`}
                    style={{ width: `${capacityPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onView(group.group_id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-indigo-400 cursor-pointer"
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />
                Details
              </button>

              <button
                type="button"
                onClick={() => onJoin(group)}
                disabled={joinAction.disabled}
                title={joinAction.title}
                className="flex flex-1 items-center justify-center rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {joinAction.label}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
