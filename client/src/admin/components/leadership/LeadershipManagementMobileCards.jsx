import React from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import {
  AdminBadge,
  AdminStatusDotBadge
} from "../ui/AdminUiPrimitives";
import {
  formatDateTime,
  getRoleBadgeClass,
  getStatusConfig,
  getTierBadgeClass
} from "./leadership.constants";

export default function LeadershipManagementMobileCards({
  busyRequestId,
  onApprove,
  onOpenGroup,
  onReject,
  rows = []
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <p className="text-sm font-semibold">No leadership requests found.</p>
        <p className="mt-1 text-xs">Try resetting or broadening your search parameters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 lg:hidden">
      {rows.map((row) => {
        const isBusy = busyRequestId === row.leadership_request_id;
        const statusConfig = getStatusConfig(row.group_status);
        const studentInitial = (row.student_name || "S").charAt(0).toUpperCase();

        return (
          <div
            key={row.leadership_request_id}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3.5"
          >
            {/* Top Bar: Squad & Tier */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {row.group_name || `Squad ${row.group_id}`}
                </h4>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {row.group_code || `GRP-${row.group_id}`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    #{row.leadership_request_id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <AdminBadge className={getTierBadgeClass(row.group_tier)}>
                  Tier {String(row.group_tier || "-").toUpperCase()}
                </AdminBadge>
                <AdminStatusDotBadge config={statusConfig} />
              </div>
            </div>

            {/* Applicant Profile */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                {studentInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 truncate dark:text-white">
                  {row.student_name || "-"}
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {row.student_id || "-"}
                </div>
                <div className="text-[11px] text-slate-400 truncate dark:text-slate-500">
                  {row.student_email || ""}
                </div>
              </div>
            </div>

            {/* Role Elevation Flow */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-850/50">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Role Elevation
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${getRoleBadgeClass(row.current_membership_role)}`}>
                  {String(row.current_membership_role || "MEMBER").replaceAll("_", " ")}
                </span>

                <ArrowForwardRoundedIcon sx={{ fontSize: 13 }} className="text-slate-400" />

                <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold shadow-2xs ${getRoleBadgeClass(row.requested_role)}`}>
                  {String(row.requested_role || "").toUpperCase() === "CAPTAIN" ? "👑 " : "🛡️ "}
                  {String(row.requested_role || "-").replaceAll("_", " ")}
                </span>
              </div>

              {row.request_reason ? (
                <div className="mt-2.5 flex items-start gap-1 rounded-lg border border-slate-200/60 bg-white p-2 text-xs text-slate-600 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-300">
                  <FormatQuoteRoundedIcon sx={{ fontSize: 14 }} className="text-slate-400 shrink-0 rotate-180" />
                  <span className="italic">{row.request_reason}</span>
                </div>
              ) : null}

              <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                Requested on {formatDateTime(row.request_date)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenGroup(row.group_id)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 cursor-pointer"
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                <span>Squad</span>
              </button>

              <button
                type="button"
                onClick={() => onApprove(row)}
                disabled={isBusy}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-500 disabled:opacity-60 cursor-pointer"
              >
                <CheckRoundedIcon sx={{ fontSize: 16 }} />
                <span>{isBusy ? "..." : "Approve"}</span>
              </button>

              <button
                type="button"
                onClick={() => onReject(row)}
                disabled={isBusy}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 disabled:opacity-60 cursor-pointer"
              >
                <CloseRoundedIcon sx={{ fontSize: 16 }} />
                <span>{isBusy ? "..." : "Reject"}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
