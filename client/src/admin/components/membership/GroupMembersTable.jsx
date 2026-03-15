import React, { useEffect, useState } from "react";
import { deleteMembership, updateMemberRole } from "../../../service/membership.api";

const ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER", "MEMBER"];

const ROLE_STYLES = {
  CAPTAIN: "border-amber-300 bg-amber-50 text-amber-800",
  VICE_CAPTAIN: "border-violet-200 bg-violet-50 text-violet-700",
  STRATEGIST: "border-blue-200 bg-blue-50 text-blue-700",
  MANAGER: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-700",
};

const badgeClass =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold";

const controlClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60";

const roleSelectBaseClass =
  "rounded-md border px-2.5 py-1 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-slate-200 disabled:opacity-60";

const HIGHLIGHT_STYLES = {
  selected: {
    mobileCard:
      "border-sky-500 bg-sky-100 shadow-[0_0_0_2px_rgba(14,165,233,0.22)] ring-1 ring-sky-200",
    desktopRow: "bg-sky-100/90",
    desktopCell: "bg-sky-100/90",
    desktopFirstCell: "border-l-4 border-sky-500 bg-sky-100/90",
  },
  self: {
    mobileCard:
      "border-emerald-500 bg-emerald-100 shadow-[0_0_0_2px_rgba(16,185,129,0.22)] ring-1 ring-emerald-200",
    desktopRow: "bg-emerald-100/90",
    desktopCell: "bg-emerald-100/90",
    desktopFirstCell: "border-l-4 border-emerald-500 bg-emerald-100/90",
  },
};

const RoleBadge = ({ role }) => {
  const normalized = String(role || "MEMBER").toUpperCase();
  const cls = ROLE_STYLES[normalized] || "border-slate-200 bg-slate-100 text-slate-700";
  return <span className={`${badgeClass} ${cls}`}>{normalized.replace("_", " ")}</span>;
};

const getRoleSelectClass = (role) => {
  const normalized = String(role || "MEMBER").toUpperCase();
  const cls = ROLE_STYLES[normalized] || "border-slate-200 bg-slate-100 text-slate-700";
  return `${roleSelectBaseClass} ${cls}`;
};

const getRoleRank = (role) => {
  const normalized = String(role || "MEMBER").toUpperCase();
  const rank = ROLES.indexOf(normalized);
  return rank === -1 ? ROLES.length : rank;
};

const getHighlightType = (member, highlightStudentId, highlightMembershipId) => {
  const membershipMatch =
    highlightMembershipId !== null &&
    String(member?.membership_id) === String(highlightMembershipId);

  if (membershipMatch) return "selected";

  const studentMatch =
    highlightStudentId !== null && String(member?.student_id) === String(highlightStudentId);

  if (studentMatch) return "self";

  return null;
};

const getCellHighlightClass = (highlightType, isFirstCell = false) => {
  const config = highlightType ? HIGHLIGHT_STYLES[highlightType] : null;
  if (!config) return "";
  return isFirstCell ? config.desktopFirstCell : config.desktopCell;
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const formatPoints = (value) => (Number(value) || 0).toLocaleString();

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
  const [popup, setPopup] = useState(null);
  const [removeDialog, setRemoveDialog] = useState({
    member: null,
    reason: "",
    error: ""
  });

  useEffect(() => {
    if (!popup) return undefined;
    const timer = setTimeout(() => setPopup(null), 3000);
    return () => clearTimeout(timer);
  }, [popup]);

  const rows = Array.isArray(members)
    ? members
        .map((member, index) => ({ member, index }))
        .sort((a, b) => {
          const rankDiff = getRoleRank(a.member?.role) - getRoleRank(b.member?.role);
          return rankDiff !== 0 ? rankDiff : a.index - b.index;
        })
        .map(({ member }) => member)
    : [];
  const extraActionColumn = canRemoveMember;
  const compactTable = !showMembershipId;
  const emptyColSpan = showMembershipId ? (extraActionColumn ? 8 : 7) : extraActionColumn ? 5 : 4;

  const changeRole = async (membershipId, role) => {
    setSavingId(membershipId);
    try {
      await updateMemberRole(membershipId, role);
      onChanged?.();
    } catch (e) {
      const apiMessage = e?.response?.data?.message || e?.response?.data?.error || "";
      const normalizedMessage = String(apiMessage).toUpperCase();
      const roleAlreadyFilled =
        normalizedMessage.includes("ALREADY HAS A") ||
        normalizedMessage.includes("ALREADY FILLED");

      setPopup({
        title: "Unable to assign role",
        message: roleAlreadyFilled
          ? "Cannot assign this role because it is already filled."
          : apiMessage || "Role update failed.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const openRemoveDialog = (member) => {
    setRemoveDialog({
      member,
      reason: "",
      error: ""
    });
  };

  const closeRemoveDialog = () => {
    if (removingId !== null) return;
    setRemoveDialog({
      member: null,
      reason: "",
      error: ""
    });
  };

  const removeMember = async () => {
    const member = removeDialog.member;
    const membershipId = member?.membership_id;
    if (!membershipId) return;
    const reason = String(removeDialog.reason || "").trim();
    if (!reason) {
      setRemoveDialog((prev) => ({
        ...prev,
        error: "Removal reason is required."
      }));
      return;
    }

    setRemovingId(membershipId);
    try {
      await deleteMembership(membershipId, reason);
      setRemoveDialog({
        member: null,
        reason: "",
        error: ""
      });
      onChanged?.();
    } catch (e) {
      const message =
        e?.response?.data?.message || e?.response?.data?.error || "Member removal failed.";
      setRemoveDialog((prev) => ({
        ...prev,
        error: message
      }));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {popup ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setPopup(null)}
        >
          <div
            className="w-[min(92vw,420px)] rounded-xl border border-red-200 bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{popup.title}</p>
                <p className="mt-1 text-xs text-slate-600">{popup.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {removeDialog.member ? (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/45 px-4"
          onClick={closeRemoveDialog}
        >
          <div
            className="w-[min(92vw,480px)] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900">Remove Member</p>
                <p className="mt-1 text-sm text-slate-600">
                  Provide a reason for removing{" "}
                  <span className="font-semibold text-slate-900">
                    {removeDialog.member?.name || removeDialog.member?.student_id || "this member"}
                  </span>{" "}
                  from the group.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRemoveDialog}
                disabled={removingId !== null}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">
                {removeDialog.member?.name || "-"}
              </div>
              <div className="mt-1 text-xs font-mono text-slate-500">
                Roll No: {removeDialog.member?.student_id || "-"}
              </div>
            </div>

            <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Removal Reason
            </label>
            <textarea
              value={removeDialog.reason}
              onChange={(e) =>
                setRemoveDialog((prev) => ({
                  ...prev,
                  reason: e.target.value,
                  error: ""
                }))
              }
              disabled={removingId !== null}
              rows={4}
              maxLength={500}
              placeholder="Explain why this member is being removed from the group."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10 disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Required for audit trail.</span>
              <span>{String(removeDialog.reason || "").length}/500</span>
            </div>

            {removeDialog.error ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {removeDialog.error}
              </div>
            ) : null}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRemoveDialog}
                disabled={removingId !== null}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removeMember}
                disabled={removingId !== null || !String(removeDialog.reason || "").trim()}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {removingId !== null ? "Removing..." : "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {rows.map((m) => {
          const highlightType = getHighlightType(m, highlightStudentId, highlightMembershipId);
          const highlightConfig = highlightType ? HIGHLIGHT_STYLES[highlightType] : null;

          const rowRemovable =
            canRemoveMember && (typeof canRemoveRow === "function" ? canRemoveRow(m) : true);

          const isBusy = savingId === m.membership_id || removingId === m.membership_id;

          return (
            <article
              key={m.membership_id}
              className={`rounded-xl border p-3 ${
                highlightConfig ? highlightConfig.mobileCard : "border-slate-200 bg-slate-50"
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
                <p className="font-mono text-slate-500">Roll No: {m.student_id || "-"}</p>
                <p className="mt-1">Joined: {formatDate(m.join_date)}</p>
                <p className="mt-1">Base Points: {formatPoints(m.base_points_earned)}</p>
                {showMembershipId ? (
                  <p className="mt-1 font-mono text-slate-500">Membership: {m.membership_id}</p>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {canEditRole ? (
                  <select
                    className={getRoleSelectClass(m.role)}
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
                    onClick={() => openRemoveDialog(m)}
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
        <table className={`${compactTable ? "min-w-[760px]" : "min-w-[1020px]"} w-full text-sm`}>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {showMembershipId ? (
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Membership ID
                </th>
              ) : null}
              {compactTable
                ? ["Student", "Role", "Join Date", "Base Points"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                    >
                      {h}
                    </th>
                  ))
                : ["Student ID", "Name", "Email", "Role", "Join Date", "Base Points Earned"].map((h) => (
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
              const highlightType = getHighlightType(m, highlightStudentId, highlightMembershipId);
              const highlightConfig = highlightType ? HIGHLIGHT_STYLES[highlightType] : null;

              const rowRemovable =
                canRemoveMember && (typeof canRemoveRow === "function" ? canRemoveRow(m) : true);

              const isBusy = savingId === m.membership_id || removingId === m.membership_id;

              return (
                <tr
                  key={m.membership_id}
                  className={highlightConfig ? highlightConfig.desktopRow : "transition hover:bg-slate-50"}
                >
                  {showMembershipId ? (
                    <td
                      className={`px-4 py-3 font-mono text-xs text-slate-500 ${getCellHighlightClass(
                        highlightType,
                        true
                      )}`}
                    >
                      {m.membership_id}
                    </td>
                  ) : null}
                  {compactTable ? (
                    <td
                      className={`px-4 py-3 ${getCellHighlightClass(
                        highlightType,
                        !showMembershipId
                      )}`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{m.name || "-"}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {m.student_id || "-"}
                      </div>
                    </td>
                  ) : (
                    <>
                      <td
                        className={`px-4 py-3 font-mono text-xs text-slate-500 ${getCellHighlightClass(
                          highlightType,
                          !showMembershipId
                        )}`}
                      >
                        {m.student_id}
                      </td>
                      <td className={`px-4 py-3 ${getCellHighlightClass(highlightType)}`}>
                        <span className="font-medium text-slate-900">{m.name}</span>
                      </td>
                      <td className={`px-4 py-3 text-slate-600 ${getCellHighlightClass(highlightType)}`}>
                        {m.email}
                      </td>
                    </>
                  )}
                  <td className={`px-4 py-3 ${getCellHighlightClass(highlightType)}`}>
                    {canEditRole ? (
                      <select
                        className={getRoleSelectClass(m.role)}
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
                  <td className={`px-4 py-3 text-xs text-slate-500 ${getCellHighlightClass(highlightType)}`}>
                    {formatDate(m.join_date)}
                  </td>
                  <td
                    className={`px-4 py-3 text-xs font-semibold text-slate-700 ${getCellHighlightClass(
                      highlightType
                    )}`}
                  >
                    {formatPoints(m.base_points_earned)}
                  </td>
                  {extraActionColumn ? (
                    <td className={`px-4 py-3 ${getCellHighlightClass(highlightType)}`}>
                      {rowRemovable ? (
                        <button
                          type="button"
                          onClick={() => openRemoveDialog(m)}
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
