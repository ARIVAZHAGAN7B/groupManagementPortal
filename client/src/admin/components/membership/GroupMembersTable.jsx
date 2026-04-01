import React, { useEffect, useMemo, useState } from "react";
import {
  deleteMembership,
  updateMemberRank,
  updateMemberRole
} from "../../../service/membership.api";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  normalizePageSize
} from "../../../shared/constants/pagination";
import { AdminBadge, AdminMappedBadge } from "../ui/AdminUiPrimitives";

const ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER", "MEMBER"];
const RANK_OPTIONS = [1, 2, 3, 4, 5];

const ROLE_STYLES = {
  CAPTAIN: "border-amber-300 bg-amber-50 text-amber-800",
  VICE_CAPTAIN: "border-violet-200 bg-violet-50 text-violet-700",
  STRATEGIST: "border-blue-200 bg-blue-50 text-blue-700",
  MANAGER: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-700",
};

const MEMBER_RANK_RULES = [
  {
    rank: 1,
    label: "Rank 1",
    criteria: "Top 2 review scores",
    summary: "Best overall score in the latest 5-phase review cycle"
  },
  {
    rank: 2,
    label: "Rank 2",
    criteria: "Next 2 review scores",
    summary: "Strong review score in the latest 5-phase review cycle"
  },
  {
    rank: 3,
    label: "Rank 3",
    criteria: "Next 2 review scores",
    summary: "Solid review score in the latest 5-phase review cycle"
  },
  {
    rank: 4,
    label: "Rank 4",
    criteria: "Next 2 review scores",
    summary: "Eligible for promotion zone in the latest 5-phase review cycle"
  },
  {
    rank: 5,
    label: "Rank 5",
    criteria: "Remaining members",
    summary: "Default rank until the next 5-phase review cycle"
  }
];

const MEMBER_RANK_STYLES = {
  1: "border-amber-300 bg-amber-50 text-amber-800",
  2: "border-cyan-200 bg-cyan-50 text-cyan-800",
  3: "border-blue-200 bg-blue-50 text-blue-700",
  4: "border-violet-200 bg-violet-50 text-violet-700",
  5: "border-slate-200 bg-slate-100 text-slate-700",
};

const badgeClass =
  "inline-flex w-fit whitespace-nowrap items-center rounded-md border pl-2 pr-1.5 py-0.5 text-[11px] font-semibold leading-4";
const compactBadgeClass =
  "inline-flex w-fit whitespace-nowrap items-center rounded-md border pl-1.5 pr-1 py-0.5 text-[10px] font-semibold leading-4";

const controlClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60";

const roleSelectBaseClass =
  "rounded-md border px-2.5 py-1 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-slate-200 disabled:opacity-60";

const rankSelectBaseClass =
  "w-[5.35rem] appearance-none rounded-md border pl-2.5 pr-5 py-1 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-slate-200 disabled:opacity-60";
const compactRankSelectBaseClass =
  "w-[4.7rem] appearance-none rounded-md border pl-2 pr-4 py-0.5 text-[11px] font-semibold outline-none transition focus:ring-2 focus:ring-slate-200 disabled:opacity-60";

const rankSelectStyle = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27 fill=%27none%27 stroke=%27%23924f02%27 stroke-width=%271.8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 8 4 4 4-4%27 /%3E%3C/svg%3E")',
  backgroundPosition: "right 0.35rem center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "0.7rem 0.7rem"
};
const compactRankSelectStyle = {
  ...rankSelectStyle,
  backgroundPosition: "right 0.25rem center",
  backgroundSize: "0.65rem 0.65rem"
};

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
  return (
    <AdminMappedBadge
      map={ROLE_STYLES}
      value={role}
      fallbackClassName="border-slate-200 bg-slate-100 text-slate-700"
      className={badgeClass}
    />
  );
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

const getMemberRankValue = (member) => {
  const rank = Number(member?.member_rank);
  return Number.isInteger(rank) && rank >= 1 && rank <= 5 ? rank : 5;
};

const getMemberRankBadge = (member) => {
  const source = String(member?.member_rank_source || "").toUpperCase();
  const rank = getMemberRankValue(member);

  if (source === "OVERRIDE") {
    return {
      text: `Rank ${rank}`,
      className: MEMBER_RANK_STYLES[rank] || MEMBER_RANK_STYLES[5],
      subtitle: member?.member_rank_criteria || "Manually assigned by captain/admin"
    };
  }

  const rule = MEMBER_RANK_RULES.find((entry) => entry.rank === rank) || MEMBER_RANK_RULES[4];

  return {
    text: rule.label,
    className: MEMBER_RANK_STYLES[rule.rank] || MEMBER_RANK_STYLES[5],
    subtitle: member?.member_rank_criteria || rule.criteria
  };
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

const getDisplayedBasePoints = (member) => {
  const groupPoints = Number(member?.group_base_points_earned);
  if (Number.isFinite(groupPoints)) return groupPoints;

  const basePoints = Number(member?.base_points_earned);
  return Number.isFinite(basePoints) ? basePoints : 0;
};

const MemberRankBadge = ({ member, compact = false }) => {
  const badge = getMemberRankBadge(member);
  return (
    <AdminBadge className={`${compact ? compactBadgeClass : badgeClass} ${badge.className}`}>
      {badge.text}
    </AdminBadge>
  );
};

const getRankSelectClass = (member, compact = false) => {
  const rank = getMemberRankValue(member);
  return `${compact ? compactRankSelectBaseClass : rankSelectBaseClass} ${
    MEMBER_RANK_STYLES[rank] || MEMBER_RANK_STYLES[5]
  }`;
};

export default function GroupMembersTable({
  members,
  canEditRole = false,
  canEditRank = false,
  canRemoveMember = false,
  canRemoveRow,
  onChanged,
  highlightStudentId = null,
  highlightMembershipId = null,
  showMembershipId = true,
  showRankCriteria = true,
  compactRank = false,
}) {
  const [savingId, setSavingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [popup, setPopup] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
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
          if (rankDiff !== 0) return rankDiff;

          const aRole = String(a.member?.role || "").toUpperCase();
          const bRole = String(b.member?.role || "").toUpperCase();
          if (aRole === "MEMBER" && bRole === "MEMBER") {
            const memberRankDiff = getMemberRankValue(a.member) - getMemberRankValue(b.member);
            if (memberRankDiff !== 0) return memberRankDiff;

            const pointDiff = getDisplayedBasePoints(b.member) - getDisplayedBasePoints(a.member);
            if (pointDiff !== 0) return pointDiff;
          }

          return a.index - b.index;
        })
        .map(({ member }) => member)
    : [];
  const extraActionColumn = canRemoveMember;
  const compactTable = !showMembershipId;
  const emptyColSpan = showMembershipId ? (extraActionColumn ? 9 : 8) : extraActionColumn ? 6 : 5;
  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return rows.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, rows, rowsPerPage]);
  const firstVisibleRow = rows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const lastVisibleRow = Math.min(rows.length, currentPage * rowsPerPage);

  useEffect(() => {
    setPage((prev) => Math.min(prev, pageCount));
  }, [pageCount]);

  useEffect(() => {
    const highlightedIndex = rows.findIndex((member) => {
      if (
        highlightMembershipId !== null &&
        String(member?.membership_id) === String(highlightMembershipId)
      ) {
        return true;
      }

      if (
        highlightStudentId !== null &&
        String(member?.student_id) === String(highlightStudentId)
      ) {
        return true;
      }

      return false;
    });

    if (highlightedIndex === -1) return;

    const nextPage = Math.floor(highlightedIndex / rowsPerPage) + 1;
    setPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [highlightMembershipId, highlightStudentId, rows, rowsPerPage]);

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

  const changeRank = async (membershipId, rank) => {
    setSavingId(membershipId);
    try {
      await updateMemberRank(membershipId, Number(rank));
      onChanged?.();
    } catch (e) {
      const apiMessage = e?.response?.data?.message || e?.response?.data?.error || "";
      setPopup({
        title: "Unable to update rank",
        message: apiMessage || "Rank update failed."
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
        {showRankCriteria ? (
          <section className="rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-3 py-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-slate-900">Member rank criteria</p>
              <p className="text-xs text-slate-600">
                Rank reviews run every 5 completed phases using loyalty, contribution, and reliability.
              </p>
            </div>

            <div className="mt-3 grid gap-2">
              {MEMBER_RANK_RULES.map((rule) => (
                <div
                  key={rule.rank}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <AdminBadge className={`${badgeClass} ${MEMBER_RANK_STYLES[rule.rank]}`}>
                      {rule.label}
                    </AdminBadge>
                    <span className="text-[11px] font-semibold text-slate-500">{rule.criteria}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{rule.summary}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {pagedRows.map((m) => {
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
                <div className="flex flex-col items-end gap-1">
                  <RoleBadge role={m.role} />
                  <MemberRankBadge member={m} compact={compactRank} />
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-600">
                <p className="font-mono text-slate-500">Roll No: {m.student_id || "-"}</p>
                <p className="mt-1">Joined: {formatDate(m.join_date)}</p>
                <p className="mt-1">Group Base Points: {formatPoints(getDisplayedBasePoints(m))}</p>
                {showRankCriteria ? (
                  <p className="mt-1">Rank Rule: {getMemberRankBadge(m).subtitle}</p>
                ) : null}
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
                {canEditRank ? (
                  <select
                    className={getRankSelectClass(m, compactRank)}
                    style={compactRank ? compactRankSelectStyle : rankSelectStyle}
                    value={String(getMemberRankValue(m))}
                    disabled={isBusy}
                    onChange={(e) => changeRank(m.membership_id, e.target.value)}
                  >
                    {RANK_OPTIONS.map((rank) => (
                      <option key={rank} value={rank}>
                        {`Rank ${rank}`}
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
        {showRankCriteria ? (
          <div className="border-b border-slate-200 bg-slate-50/80 pl-4 pr-3 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Member rank criteria</p>
                <p className="mt-1 text-xs text-slate-600">
                  Rank reviews run every 5 completed phases using loyalty, contribution, and reliability.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                2 slots per rank
              </span>
            </div>

            <div className="mt-3 overflow-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-[620px] w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {["Rank", "Review Rule", "Meaning"].map((header) => (
                      <th
                        key={header}
                        className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MEMBER_RANK_RULES.map((rule) => (
                    <tr key={rule.rank}>
                      <td className="px-3 py-2">
                        <AdminBadge className={`${badgeClass} ${MEMBER_RANK_STYLES[rule.rank]}`}>
                          {rule.label}
                        </AdminBadge>
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-700">{rule.criteria}</td>
                      <td className="px-3 py-2 text-slate-600">{rule.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <table className={`${compactTable ? "min-w-[860px]" : "min-w-[1160px]"} w-full text-sm`}>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {showMembershipId ? (
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Membership ID
                </th>
              ) : null}
              {compactTable
                ? ["Student", "Role", "Rank", "Join Date", "Group Base Points"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                    >
                      {h}
                    </th>
                  ))
                : ["Student ID", "Name", "Email", "Role", "Rank", "Join Date", "Group Base Points"].map((h) => (
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
            {pagedRows.map((m) => {
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
                  <td className={`pl-4 pr-2 py-3 ${getCellHighlightClass(highlightType)}`}>
                    <div className="flex flex-col gap-1">
                      {canEditRank ? (
                        <select
                          className={getRankSelectClass(m, compactRank)}
                          style={compactRank ? compactRankSelectStyle : rankSelectStyle}
                          value={String(getMemberRankValue(m))}
                          disabled={isBusy}
                          onChange={(e) => changeRank(m.membership_id, e.target.value)}
                        >
                          {RANK_OPTIONS.map((rank) => (
                            <option key={rank} value={rank}>
                              {`Rank ${rank}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <MemberRankBadge member={m} compact={compactRank} />
                      )}
                      {showRankCriteria ? (
                        <span className="text-[11px] text-slate-500">{getMemberRankBadge(m).subtitle}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-xs text-slate-500 ${getCellHighlightClass(highlightType)}`}>
                    {formatDate(m.join_date)}
                  </td>
                  <td
                    className={`px-4 py-3 text-xs font-semibold text-slate-700 ${getCellHighlightClass(
                      highlightType
                    )}`}
                  >
                    {formatPoints(getDisplayedBasePoints(m))}
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

      {rows.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium text-slate-600">
            Showing {firstVisibleRow}-{lastVisibleRow} of {rows.length} members
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="min-w-[6.5rem] px-3 text-center text-xs font-semibold text-slate-500">
                {currentPage} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={currentPage >= pageCount}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Rows
              </span>
              <div className="flex items-center gap-2">
                {PAGE_SIZE_OPTIONS.map((value) => {
                  const selected = rowsPerPage === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setRowsPerPage(normalizePageSize(value));
                        setPage(1);
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        selected
                          ? "border-[#1754cf] bg-[#1754cf] text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
