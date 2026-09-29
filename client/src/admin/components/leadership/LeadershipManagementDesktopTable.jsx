import React from "react";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
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

export default function LeadershipManagementDesktopTable({
  busyRequestId,
  onApprove,
  onOpenGroup,
  onReject,
  rows = []
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-[1180px] w-full text-xs text-left">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Applicant</th>
              <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Target Squad</th>
              <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Tier</th>
              <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Squad Status</th>
              <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Promotion Flow</th>
              <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Requested At</th>
              <th className="sticky right-0 z-10 bg-slate-50/90 px-5 py-3.5 text-right font-bold uppercase tracking-wider dark:bg-slate-850 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]">
                Adjudication
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length > 0 ? (
              rows.map((row) => {
                const isBusy = busyRequestId === row.leadership_request_id;
                const studentInitial = (row.student_name || "S").charAt(0).toUpperCase();

                return (
                  <tr
                    key={row.leadership_request_id}
                    className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-850/50"
                  >
                    {/* Applicant Profile */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                          {studentInitial}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {row.student_name || "-"}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                              {row.student_id || "-"}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              #{row.leadership_request_id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                            {row.student_email || ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Target Squad */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {row.group_name || `Squad ${row.group_id}`}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {row.group_code || `GRP-${row.group_id}`}
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="px-5 py-4">
                      <AdminBadge className={getTierBadgeClass(row.group_tier)}>
                        Tier {String(row.group_tier || "-").toUpperCase()}
                      </AdminBadge>
                    </td>

                    {/* Squad Status */}
                    <td className="px-5 py-4">
                      <AdminStatusDotBadge config={getStatusConfig(row.group_status)} />
                    </td>

                    {/* Role Promotion Flow */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ${getRoleBadgeClass(row.current_membership_role)}`}>
                          {String(row.current_membership_role || "MEMBER").replaceAll("_", " ")}
                        </span>

                        <ArrowForwardRoundedIcon sx={{ fontSize: 13 }} className="text-slate-400" />

                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-bold shadow-2xs ${getRoleBadgeClass(row.requested_role)}`}>
                          {String(row.requested_role || "").toUpperCase() === "CAPTAIN" ? "👑 " : "🛡️ "}
                          {String(row.requested_role || "-").replaceAll("_", " ")}
                        </span>
                      </div>

                      {row.request_reason ? (
                        <div className="mt-2 flex items-start gap-1 rounded-lg border border-slate-100 bg-slate-50/80 p-2 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300 max-w-[260px]">
                          <FormatQuoteRoundedIcon sx={{ fontSize: 14 }} className="text-slate-400 shrink-0 rotate-180" />
                          <span className="italic line-clamp-2">{row.request_reason}</span>
                        </div>
                      ) : null}
                    </td>

                    {/* Requested At */}
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {formatDateTime(row.request_date)}
                    </td>

                    {/* Action Column */}
                    <td className="sticky right-0 z-10 bg-white/95 px-5 py-4 text-right backdrop-blur-xs dark:bg-slate-900/95 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]">
                      <div className="ml-auto flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenGroup(row.group_id)}
                          title="View Squad"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition cursor-pointer"
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onApprove(row)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-500 disabled:opacity-60 cursor-pointer"
                        >
                          <CheckRoundedIcon sx={{ fontSize: 14 }} />
                          {isBusy ? "..." : "Approve"}
                        </button>

                        <button
                          type="button"
                          onClick={() => onReject(row)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 disabled:opacity-60 cursor-pointer"
                        >
                          <CloseRoundedIcon sx={{ fontSize: 14 }} />
                          {isBusy ? "..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-sm font-semibold">No leadership requests match your current filters.</p>
                  <p className="mt-1 text-xs">Try broadening your search or resetting preset filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
