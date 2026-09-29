import React from "react";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function LeadershipAttentionPanel({ groups, onOpenGroup }) {
  if (!Array.isArray(groups) || groups.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 p-4 shadow-xs sm:p-5 dark:border-amber-900/60 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 border border-amber-300/60 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-700/60">
            <WarningAmberRoundedIcon sx={{ fontSize: 22 }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Squads Lacking Leadership
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                {groups.length} {groups.length === 1 ? "Squad" : "Squads"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-amber-700/90 dark:text-amber-400/90">
              These active squads have no designated Captain or Vice Captain. Prioritize review for their applicants.
            </p>
          </div>
        </div>

        {/* Squad Quick Links */}
        <div className="flex flex-wrap items-center gap-2">
          {groups.map((group) => (
            <button
              key={`leadership-alert-${group.group_id}`}
              type="button"
              onClick={() => onOpenGroup(group.group_id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/90 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs transition hover:bg-white hover:border-amber-400 hover:shadow-xs dark:border-amber-800/80 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-850 cursor-pointer"
            >
              <span>{group.group_name || `Squad ${group.group_id}`}</span>
              {group.group_code ? (
                <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400">
                  [{group.group_code}]
                </span>
              ) : null}
              <ArrowForwardRoundedIcon sx={{ fontSize: 13 }} className="text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
