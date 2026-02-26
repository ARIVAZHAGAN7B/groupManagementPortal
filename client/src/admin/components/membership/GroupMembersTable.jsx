import React, { useState } from "react";
import { deleteMembership, updateMemberRole } from "../../../service/membership.api";

const ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER", "MEMBER"];

const ROLE_STYLES = {
  CAPTAIN: "bg-blue-50 text-blue-700 border-blue-200",
  VICE_CAPTAIN: "bg-purple-50 text-purple-700 border-purple-200",
  STRATEGIST: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
  MEMBER: "bg-gray-100 text-gray-600 border-gray-200"
};

const RoleBadge = ({ role }) => {
  const cls = ROLE_STYLES[role] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold tracking-wide ${cls}`}
    >
      {String(role || "MEMBER").replace("_", " ")}
    </span>
  );
};

export default function GroupMembersTable({
  members,
  canEditRole = false,
  canRemoveMember = false,
  canRemoveRow,
  onChanged,
  highlightStudentId = null,
  highlightMembershipId = null,
  showMembershipId = true
}) {
  const [savingId, setSavingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const changeRole = async (membershipId, role) => {
    setSavingId(membershipId);
    try {
      await updateMemberRole(membershipId, role);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data?.error || "Role update failed");
    } finally {
      setSavingId(null);
    }
  };

  const removeMember = async (member) => {
    const membershipId = member?.membership_id;
    if (!membershipId) return;

    const ok = window.confirm(
      `Remove student ${member?.student_id || ""} from this group?`
    );
    if (!ok) return;

    setRemovingId(membershipId);
    try {
      await deleteMembership(membershipId);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data?.error || "Member removal failed");
    } finally {
      setRemovingId(null);
    }
  };

  const extraActionColumn = canRemoveMember;
  const emptyColSpan = showMembershipId ? (extraActionColumn ? 7 : 6) : extraActionColumn ? 6 : 5;

  return (
    <div className="overflow-auto rounded-xl border border-gray-100">
      <table className="min-w-[900px] w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {showMembershipId ? (
              <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">
                Membership ID
              </th>
            ) : null}
            {["Student ID", "Name", "Email", "Role", "Join Date"].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400"
              >
                {h}
              </th>
            ))}
            {extraActionColumn ? (
              <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {(Array.isArray(members) ? members : []).map((m) => {
            const isHighlighted =
              (highlightMembershipId !== null &&
                String(m.membership_id) === String(highlightMembershipId)) ||
              (highlightStudentId !== null && String(m.student_id) === String(highlightStudentId));

            const rowRemovable =
              canRemoveMember &&
              (typeof canRemoveRow === "function" ? canRemoveRow(m) : true);

            const isBusy = savingId === m.membership_id || removingId === m.membership_id;

            return (
              <tr
                key={m.membership_id}
                className={
                  isHighlighted
                    ? "bg-yellow-200 hover:bg-yellow-200"
                    : "hover:bg-gray-50 transition-colors"
                }
                title={isHighlighted ? "Highlighted member" : undefined}
              >
                {showMembershipId ? (
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{m.membership_id}</td>
                ) : null}
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{m.student_id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                <td className="px-4 py-3 text-gray-500">{m.email}</td>
                <td className="px-4 py-3">
                  {canEditRole ? (
                    <div className="relative">
                      <select
                        className={`
                          appearance-none pl-2 pr-6 py-1 rounded-md border text-[11px] font-semibold
                          tracking-wide cursor-pointer transition-colors disabled:opacity-50
                          focus:outline-none focus:ring-2 focus:ring-blue-200
                          ${ROLE_STYLES[m.role] ?? "bg-gray-100 text-gray-600 border-gray-200"}
                        `}
                        value={m.role}
                        disabled={isBusy}
                        onChange={(e) => changeRole(m.membership_id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-current opacity-60">
                        v
                      </span>
                    </div>
                  ) : (
                    <RoleBadge role={m.role} />
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {m.join_date ? new Date(m.join_date).toLocaleString() : "-"}
                </td>
                {extraActionColumn ? (
                  <td className="px-4 py-3">
                    {rowRemovable ? (
                      <button
                        type="button"
                        onClick={() => removeMember(m)}
                        disabled={isBusy}
                        className="px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {removingId === m.membership_id ? "Removing..." : "Remove"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}

          {(!Array.isArray(members) || members.length === 0) && (
            <tr>
              <td colSpan={emptyColSpan} className="px-4 py-8 text-center text-sm text-gray-400">
                No active members.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
