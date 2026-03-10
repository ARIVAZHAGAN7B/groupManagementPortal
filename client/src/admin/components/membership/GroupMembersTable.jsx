import React, { useState } from "react";
import { deleteMembership, updateMemberRole } from "../../../service/membership.api";

const ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER", "MEMBER"];

const ROLE_STYLES = {
  CAPTAIN: "border-blue-200 bg-blue-50 text-blue-700",
  VICE_CAPTAIN: "border-violet-200 bg-violet-50 text-violet-700",
  STRATEGIST: "border-indigo-200 bg-indigo-50 text-indigo-700",
  MANAGER: "border-amber-200 bg-amber-50 text-amber-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-700",
};

const badgeClass =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold";

const controlClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60";

const RoleBadge = ({ role }) => {
  const normalized = String(role || "MEMBER").toUpperCase();
  const cls = ROLE_STYLES[normalized] || "border-slate-200 bg-slate-100 text-slate-700";
  return <span className={`${badgeClass} ${cls}`}>{normalized.replace("_", " ")}</span>;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

export default function GroupMembersTable({
  members,
  canEditRole = false,
  canRemoveMember = false,
  canRemoveRow,
  onChanged,
  highlightStudentId = null,
  highlightMembershipId = null,
  showMembershipId = true,
}) {
  const [savingId, setSavingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const rows = Array.isArray(members) ? members : [];
  const extraActionColumn = canRemoveMember;
  const emptyColSpan = showMembershipId ? (extraActionColumn ? 7 : 6) : extraActionColumn ? 6 : 5;

  const changeRole = async (membershipId, role) => {
    setSavingId(membershipId);
    try {
      await updateMemberRole(membershipId, role);
      onChanged?.();
    } catch (e) {
      window.alert(e?.response?.data?.message || e?.response?.data?.error || "Role update failed");
    } finally {
      setSavingId(null);
    }
  };

  const removeMember = async (member) => {
    const membershipId = member?.membership_id;
    if (!membershipId) return;

    const ok = window.confirm(`Remove student ${member?.student_id || ""} from this group?`);
    if (!ok) return;

    setRemovingId(membershipId);
    try {
      await deleteMembership(membershipId);
      onChanged?.();
    } catch (e) {
      window.alert(e?.response?.data?.message || e?.response?.data?.error || "Member removal failed");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {rows.map((m) => {
          const isHighlighted =
            (highlightMembershipId !== null &&
              String(m.membership_id) === String(highlightMembershipId)) ||
            (highlightStudentId !== null && String(m.student_id) === String(highlightStudentId));

          const rowRemovable =
            canRemoveMember && (typeof canRemoveRow === "function" ? canRemoveRow(m) : true);

          const isBusy = savingId === m.membership_id || removingId === m.membership_id;

          return (
            <article
              key={m.membership_id}
              className={`rounded-xl border p-3 ${
                isHighlighted ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.name || "-"}</p>
                  <p className="text-xs font-mono text-slate-500">{m.student_id}</p>
                </div>
                <RoleBadge role={m.role} />
              </div>

              <div className="mt-2 text-xs text-slate-600">
                <p>{m.email || "-"}</p>
                <p className="mt-1">Joined: {formatDateTime(m.join_date)}</p>
                {showMembershipId ? (
                  <p className="mt-1 font-mono text-slate-500">Membership: {m.membership_id}</p>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {canEditRole ? (
                  <select
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                    value={String(m.role || "MEMBER").toUpperCase()}
                    disabled={isBusy}
                    onChange={(e) => changeRole(m.membership_id, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                ) : null}

                {rowRemovable ? (
                  <button
                    type="button"
                    onClick={() => removeMember(m)}
                    disabled={isBusy}
                    className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 disabled:opacity-60"
                  >
                    {removingId === m.membership_id ? "Removing..." : "Remove"}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}

        {rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
            No active members.
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-auto rounded-xl border border-slate-200 md:block">
        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {showMembershipId ? (
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Membership ID
                </th>
              ) : null}
              {["Student ID", "Name", "Email", "Role", "Join Date"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  {h}
                </th>
              ))}
              {extraActionColumn ? (
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((m) => {
              const isHighlighted =
                (highlightMembershipId !== null &&
                  String(m.membership_id) === String(highlightMembershipId)) ||
                (highlightStudentId !== null && String(m.student_id) === String(highlightStudentId));

              const rowRemovable =
                canRemoveMember && (typeof canRemoveRow === "function" ? canRemoveRow(m) : true);

              const isBusy = savingId === m.membership_id || removingId === m.membership_id;

              return (
                <tr
                  key={m.membership_id}
                  className={isHighlighted ? "bg-amber-50" : "transition hover:bg-slate-50"}
                >
                  {showMembershipId ? (
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.membership_id}</td>
                  ) : null}
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.student_id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.email}</td>
                  <td className="px-4 py-3">
                    {canEditRole ? (
                      <select
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                        value={String(m.role || "MEMBER").toUpperCase()}
                        disabled={isBusy}
                        onChange={(e) => changeRole(m.membership_id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(m.join_date)}</td>
                  {extraActionColumn ? (
                    <td className="px-4 py-3">
                      {rowRemovable ? (
                        <button
                          type="button"
                          onClick={() => removeMember(m)}
                          disabled={isBusy}
                          className={controlClass}
                        >
                          {removingId === m.membership_id ? "Removing..." : "Remove"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td colSpan={emptyColSpan} className="px-4 py-8 text-center text-sm text-slate-500">
                  No active members.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
