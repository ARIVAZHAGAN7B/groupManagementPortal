import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import { WorkspaceFilterBar } from "../../../shared/components/WorkspaceInlineFilters";
import { TeamDesktopTableShell } from "../teams/TeamDesktopTableControls";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import { formatDateTime, formatLabel } from "../teams/teamPage.utils";

export default function RequestCenterEventInvites({
  canReset,
  decisionBusyId,
  error,
  loading,
  onDecision,
  onReset,
  query,
  rows,
  setQuery
}) {
  if (loading) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500">Loading event team invites...</div>;
  }

  return (
    <>
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-3 p-4 lg:hidden">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
            No event team invites found for the current filters.
          </div>
        ) : (
          rows.map((row) => {
            const pending = String(row.status || "").toUpperCase() === "PENDING";

            return (
              <article key={row.invitation_id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-slate-900">
                      {row.team_name || row.team_code || "Event Team"}
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {row.event_name || row.event_code || "-"}
                    </p>
                  </div>
                  <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TeamPageDetailTile label="Invited By" value={row.inviter_name || row.inviter_student_id || "-"} />
                  <TeamPageDetailTile label="Role" value={formatLabel(row.proposed_role, "Member")} />
                  <TeamPageDetailTile label="Sent" value={formatDateTime(row.sent_at)} />
                  <TeamPageDetailTile label="Rounds Cleared" value={row.rounds_cleared} />
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Response Note
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {row.response_note || "No response note yet."}
                  </p>
                </div>

                {pending ? (
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDecision(row.invitation_id, "ACCEPTED")}
                      disabled={decisionBusyId === row.invitation_id}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {decisionBusyId === row.invitation_id ? "Working..." : "Accept"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision(row.invitation_id, "REJECTED")}
                      disabled={decisionBusyId === row.invitation_id}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {decisionBusyId === row.invitation_id ? "Working..." : "Reject"}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
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
                placeholder: "Search by team, event, inviter, or status",
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
          <table className="min-w-[1180px] w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Team</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Event</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Invited By</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Role</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Sent</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Status</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Response</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                    No event team invites found for the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const pending = String(row.status || "").toUpperCase() === "PENDING";

                  return (
                    <tr key={row.invitation_id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-900">{row.team_name || "-"}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{row.team_code || "-"}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-900">{row.event_name || "-"}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{row.event_code || "-"}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        <div>{row.inviter_name || "-"}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{row.inviter_email || row.inviter_student_id || "-"}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{formatLabel(row.proposed_role, "Member")}</td>
                      <td className="px-3 py-2.5 text-slate-700">{formatDateTime(row.sent_at)}</td>
                      <td className="px-3 py-2.5">
                        <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        <p className="max-w-[220px] leading-5">{row.response_note || "No response note yet."}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        {pending ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onDecision(row.invitation_id, "ACCEPTED")}
                              disabled={decisionBusyId === row.invitation_id}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {decisionBusyId === row.invitation_id ? "Working..." : "Accept"}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDecision(row.invitation_id, "REJECTED")}
                              disabled={decisionBusyId === row.invitation_id}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {decisionBusyId === row.invitation_id ? "Working..." : "Reject"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TeamDesktopTableShell>
    </>
  );
}
