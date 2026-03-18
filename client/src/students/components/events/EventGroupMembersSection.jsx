import { useCallback, useState } from "react";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import { leaveTeamMembership } from "../../../service/teams.api";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import {
  formatLabel,
  formatShortDate
} from "../teams/teamPage.utils";

function MemberCard({ action = null, row }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-slate-900">
            {row.student_name || "-"}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{row.student_email || "-"}</p>
        </div>
        <AllGroupsBadge value={formatLabel(row.role, "Member")} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TeamPageDetailTile label="Student ID" value={row.student_id || "-"} />
        <TeamPageDetailTile label="Joined" value={formatShortDate(row.join_date)} />
      </div>

      {action ? <div className="mt-4 flex items-center gap-2">{action}</div> : null}
    </article>
  );
}

function EventGroupMemberRemoveModal({
  member,
  busy = false,
  error = "",
  onCancel,
  onConfirm
}) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.24)]">
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose-700">
            Remove Member
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {member.student_name || member.student_id || "Selected member"}
          </h3>
          <p className="mt-1 text-sm text-rose-800">
            This will remove the member from the event group.
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              {member.student_name || "-"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {member.student_id || "-"} | {member.student_email || "-"}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <AllGroupsBadge value={formatLabel(member.role, "Member")} />
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                Joined {formatShortDate(member.join_date)}
              </span>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Removing..." : "Remove Member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventGroupMembersSection({
  members = [],
  canRemoveMember = false,
  currentStudentId = null,
  onChanged
}) {
  const [removeMemberRow, setRemoveMemberRow] = useState(null);
  const [removeBusyMembershipId, setRemoveBusyMembershipId] = useState(null);
  const [removeError, setRemoveError] = useState("");

  const canRemoveRow = useCallback(
    (row) =>
      canRemoveMember && String(row?.student_id || "") !== String(currentStudentId || ""),
    [canRemoveMember, currentStudentId]
  );

  const handleOpenRemoveDialog = useCallback((row) => {
    setRemoveError("");
    setRemoveMemberRow(row || null);
  }, []);

  const handleCloseRemoveDialog = useCallback(() => {
    if (removeBusyMembershipId) return;
    setRemoveMemberRow(null);
    setRemoveError("");
  }, [removeBusyMembershipId]);

  const handleConfirmRemove = useCallback(async () => {
    const membershipId = Number(removeMemberRow?.team_membership_id);
    if (!membershipId) return;

    setRemoveBusyMembershipId(membershipId);
    setRemoveError("");

    try {
      await leaveTeamMembership(membershipId, {
        notes: "Removed by captain from event group members list"
      });
      setRemoveMemberRow(null);
      onChanged?.();
    } catch (error) {
      setRemoveError(error?.response?.data?.message || "Failed to remove member");
    } finally {
      setRemoveBusyMembershipId(null);
    }
  }, [onChanged, removeMemberRow?.team_membership_id]);

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Event Group Members</h2>
          <p className="mt-1 text-sm text-slate-500">
            Active members currently assigned to this event group.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            No active members found for this event group.
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {members.map((row) => {
                const rowRemovable = canRemoveRow(row);

                return (
                  <MemberCard
                    key={row.team_membership_id || `${row.student_id}-${row.join_date}`}
                    row={row}
                    action={
                      rowRemovable ? (
                        <button
                          type="button"
                          onClick={() => handleOpenRemoveDialog(row)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Remove
                        </button>
                      ) : null
                    }
                  />
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Student
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Email
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Role
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Joined
                    </th>
                    {canRemoveMember ? (
                      <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                        Actions
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {members.map((row) => {
                    const rowRemovable = canRemoveRow(row);

                    return (
                      <tr
                        key={row.team_membership_id || `${row.student_id}-${row.join_date}`}
                        className="hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {row.student_name || "-"}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            ID: {row.student_id || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.student_email || "-"}</td>
                        <td className="px-4 py-3">
                          <AllGroupsBadge value={formatLabel(row.role, "Member")} />
                        </td>
                        <td className="px-4 py-3">
                          <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatShortDate(row.join_date)}
                        </td>
                        {canRemoveMember ? (
                          <td className="px-4 py-3">
                            {rowRemovable ? (
                              <button
                                type="button"
                                onClick={() => handleOpenRemoveDialog(row)}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                              >
                                Remove
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <EventGroupMemberRemoveModal
        member={removeMemberRow}
        busy={removeBusyMembershipId === Number(removeMemberRow?.team_membership_id)}
        error={removeError}
        onCancel={handleCloseRemoveDialog}
        onConfirm={handleConfirmRemove}
      />
    </>
  );
}
