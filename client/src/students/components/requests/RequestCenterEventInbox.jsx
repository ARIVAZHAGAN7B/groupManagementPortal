import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import { WorkspaceFilterBar } from "../../../shared/components/WorkspaceInlineFilters";
import {
  TeamDesktopTableShell
} from "../teams/TeamDesktopTableControls";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import { formatDateTime } from "../teams/teamPage.utils";
import { selectClassName } from "./requestCenter.utils";

export default function RequestCenterEventInbox({
  approvalRoleByRequestId,
  canReset,
  captainTeams,
  decisionBusyId,
  error,
  filteredRows,
  loading,
  onChangeApprovalRole,
  onDecision,
  onLoadInbox,
  onReset,
  query,
  rows,
  selectedCaptainTeam,
  selectedTeamId,
  setQuery,
  setSelectedTeamId
}) {
  if (captainTeams.length === 0) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500">You are not a captain in any active event group.</div>;
  }

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#1754cf]">Event Group Inboxes</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">Choose a captain inbox</h2>
            <p className="mt-1 text-xs text-slate-500">Switch between your event groups to review pending join requests.</p>
          </div>

          <button
            type="button"
            onClick={() => onLoadInbox(selectedTeamId)}
            disabled={!selectedTeamId || loading}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Refreshing..." : "Refresh inbox"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr,1fr]">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Captain Event Group
            </span>
            <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} className={selectClassName}>
              {captainTeams.map((row) => (
                <option key={row.team_membership_id} value={row.team_id}>
                  {row.team_name} ({row.team_code})
                </option>
              ))}
            </select>
          </label>

          <TeamPageDetailTile
            label="Selected Inbox"
            value={selectedCaptainTeam?.team_name || "No captain group selected"}
            subtext={
              selectedCaptainTeam
                ? selectedCaptainTeam.event_name || selectedCaptainTeam.event_code || "No event"
                : "Select a captain group to review requests"
            }
          />
        </div>
      </section>

      {error ? <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
      {loading ? <div className="px-4 py-12 text-center text-sm text-slate-500">Loading event-group requests...</div> : null}
      {!loading && !error && filteredRows.length === 0 ? <div className="px-4 py-12 text-center text-sm text-slate-500">No pending event-group requests found for this inbox.</div> : null}
      {loading || error || filteredRows.length === 0 ? null : (
        <>

          <div className="space-y-3 p-4 lg:hidden">
            {filteredRows.map((row) => (
              <article key={row.event_request_id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-slate-900">{row.student_name || "-"}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{row.student_email || "-"}</p>
                  </div>
                  <AllGroupsBadge value="Pending" />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TeamPageDetailTile label="Student ID" value={row.student_id || "-"} />
                  <TeamPageDetailTile label="Submitted" value={formatDateTime(row.request_date)} />
                  <TeamPageDetailTile label="Department" value={row.department || "-"} />
                  <TeamPageDetailTile label="Year" value={row.year ?? "-"} />
                </div>

                <label className="mt-4 block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Approve As</span>
                  <select
                    value={approvalRoleByRequestId[row.event_request_id] || "MEMBER"}
                    onChange={(event) => onChangeApprovalRole(row.event_request_id, event.target.value)}
                    disabled={decisionBusyId === row.event_request_id}
                    className={selectClassName}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="VICE_CAPTAIN">Vice Captain</option>
                  </select>
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onDecision(row.event_request_id, "APPROVED")}
                    disabled={decisionBusyId === row.event_request_id}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {decisionBusyId === row.event_request_id ? "Working..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecision(row.event_request_id, "REJECTED")}
                    disabled={decisionBusyId === row.event_request_id}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {decisionBusyId === row.event_request_id ? "Working..." : "Reject"}
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
                    placeholder: "Search by student, email, department, or year",
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
              <table className="min-w-[1260px] w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Student</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Student ID</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Email</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Department</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Year</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Submitted</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Approve As</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.map((row) => (
                    <tr key={row.event_request_id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2.5 font-medium text-slate-900">{row.student_name || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-700">{row.student_id || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-700">{row.student_email || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-700">{row.department || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-700">{row.year ?? "-"}</td>
                      <td className="px-3 py-2.5 text-slate-700">{formatDateTime(row.request_date)}</td>
                      <td className="px-3 py-2.5">
                        <select
                          value={approvalRoleByRequestId[row.event_request_id] || "MEMBER"}
                          onChange={(event) => onChangeApprovalRole(row.event_request_id, event.target.value)}
                          disabled={decisionBusyId === row.event_request_id}
                          className="w-full rounded-lg border border-slate-300 bg-[#f3f4f6] px-2.5 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="VICE_CAPTAIN">Vice Captain</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onDecision(row.event_request_id, "APPROVED")}
                            disabled={decisionBusyId === row.event_request_id}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {decisionBusyId === row.event_request_id ? "Working..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDecision(row.event_request_id, "REJECTED")}
                            disabled={decisionBusyId === row.event_request_id}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {decisionBusyId === row.event_request_id ? "Working..." : "Reject"}
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
      )}
    </>
  );
}
