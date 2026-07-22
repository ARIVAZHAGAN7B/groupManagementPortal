import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import { WorkspaceFilterBar } from "../../../shared/components/WorkspaceInlineFilters";
import {
  TeamDesktopTableShell
} from "../teams/TeamDesktopTableControls";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import { formatDateTime, formatLabel } from "../teams/teamPage.utils";

export default function RequestCenterGroupInbox({
  canReset,
  currentGroupLabel,
  decisionBusyId,
  error,
  isGroupCaptain,
  loading,
  onDecision,
  onReset,
  query,
  rows,
  setQuery
}) {
  if (!isGroupCaptain) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500">You need captain access in your current group to manage group join requests.</div>;
  }

  if (error) {
    return <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  }

  if (loading) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500">Loading group requests...</div>;
  }

  if (rows.length === 0) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500">No pending group requests found.</div>;
  }

  return (
    <>
      <div className="space-y-3 p-4 lg:hidden">
        {rows.map((row) => (
          <article key={row.request_id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900">{row.student_id || "-"}</h2>
              </div>
              <AllGroupsBadge value={formatLabel(row.status, "Pending")} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TeamPageDetailTile label="Submitted" value={formatDateTime(row.request_date)} />
              <TeamPageDetailTile label="Group" value={currentGroupLabel} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onDecision(row.request_id, "APPROVED")}
                disabled={decisionBusyId === row.request_id}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {decisionBusyId === row.request_id ? "Working..." : "Approve"}
              </button>
              <button
                type="button"
                onClick={() => onDecision(row.request_id, "REJECTED")}
                disabled={decisionBusyId === row.request_id}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {decisionBusyId === row.request_id ? "Working..." : "Reject"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <TeamDesktopTableShell
        canReset={canReset}
        onReset={onReset}
        toolbar={
          <WorkspaceFilterBar
            fields={[
              {
                key: "query",
                type: "search",
                label: "Search",
                value: query,
                placeholder: "Search by student id or request id",
                onChangeValue: setQuery
              }
            ]}
            onReset={onReset}
            hasActiveFilters={canReset}
            showReset={false}
          />
        }
      >
        <div className="overflow-x-auto overflow-y-visible rounded-2xl">
          <table className="min-w-[860px] w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Student ID</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Submitted</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Status</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {rows.map((row) => (
                <tr key={row.request_id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{row.student_id || "-"}</td>
                  <td className="px-3 py-2.5 text-slate-700">{formatDateTime(row.request_date)}</td>
                  <td className="px-3 py-2.5">
                    <AllGroupsBadge value={formatLabel(row.status, "Pending")} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onDecision(row.request_id, "APPROVED")}
                        disabled={decisionBusyId === row.request_id}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {decisionBusyId === row.request_id ? "Working..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDecision(row.request_id, "REJECTED")}
                        disabled={decisionBusyId === row.request_id}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {decisionBusyId === row.request_id ? "Working..." : "Reject"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TeamDesktopTableShell>
    </>
  );
}
