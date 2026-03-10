import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { fetchGroupById } from "../../../service/groups.api";
import { useAuth } from "../../../utils/AuthContext";
import {
  fetchGroupMembers,
  joinGroup,
  leaveGroup,
} from "../../../service/membership.api";
import GroupMembersTable from "../../components/membership/GroupMembersTable";
import {
  getPendingRequestsByGroup,
  decideJoinRequest,
} from "../../../service/joinRequests.api";
import {
  getPendingLeadershipRequestsByGroup,
  decideLeadershipRoleRequest,
} from "../../../service/leadershipRequests.api";

const BADGE_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  A: "border-blue-200 bg-blue-50 text-blue-700",
  B: "border-violet-200 bg-violet-50 text-violet-700",
  C: "border-amber-200 bg-amber-50 text-amber-700",
  D: "border-slate-200 bg-slate-100 text-slate-700",
  CAPTAIN: "border-blue-200 bg-blue-50 text-blue-700",
  VICE_CAPTAIN: "border-violet-200 bg-violet-50 text-violet-700",
  STRATEGIST: "border-indigo-200 bg-indigo-50 text-indigo-700",
  MANAGER: "border-amber-200 bg-amber-50 text-amber-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-700",
};

const LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];

const titleFont = { fontFamily: "\"Georgia\", \"Times New Roman\", serif" };

const Badge = ({ value }) => {
  const text = String(value || "-");
  const key = text.toUpperCase();
  const cls = BADGE_STYLES[key] || "border-slate-200 bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      {text}
    </span>
  );
};

const StatCard = ({ label, value, extra = null }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
    <div className="mt-2 text-base font-semibold text-slate-900">{value}</div>
    {extra ? <div className="mt-1 text-xs text-slate-500">{extra}</div> : null}
  </div>
);

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

export default function GroupDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [pendingLeadershipRequests, setPendingLeadershipRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState("");

  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingErr, setPendingErr] = useState("");
  const [decisionBusyId, setDecisionBusyId] = useState(null);

  const [pendingLeadershipLoading, setPendingLeadershipLoading] = useState(false);
  const [pendingLeadershipErr, setPendingLeadershipErr] = useState("");
  const [leadershipDecisionBusyId, setLeadershipDecisionBusyId] = useState(null);

  const highlightStudentId = searchParams.get("highlightStudentId");
  const highlightMembershipId = searchParams.get("highlightMembershipId");

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const [g, m] = await Promise.all([fetchGroupById(id), fetchGroupMembers(id)]);
      setGroup(g || null);
      setMembers(Array.isArray(m) ? m : []);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load group"
      );
      setGroup(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async () => {
    setPendingLoading(true);
    setPendingErr("");
    try {
      const data = await getPendingRequestsByGroup(id);
      setPending(Array.isArray(data) ? data : []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403 || status === 401) {
        setPending([]);
      } else {
        setPendingErr(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            "Failed to load pending requests"
        );
      }
    } finally {
      setPendingLoading(false);
    }
  };

  const loadPendingLeadership = async () => {
    setPendingLeadershipLoading(true);
    setPendingLeadershipErr("");
    try {
      const data = await getPendingLeadershipRequestsByGroup(id);
      setPendingLeadershipRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403 || status === 401) {
        setPendingLeadershipRequests([]);
      } else {
        setPendingLeadershipErr(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            "Failed to load pending leadership role requests"
        );
      }
    } finally {
      setPendingLeadershipLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    loadPending();
    loadPendingLeadership();
  }, [id]);

  const onJoin = async () => {
    setBusy(true);
    setActionErr("");
    try {
      await joinGroup(id);
      await Promise.all([loadAll(), loadPending(), loadPendingLeadership()]);
    } catch (e) {
      setActionErr(e?.response?.data?.message || "Join failed");
    } finally {
      setBusy(false);
    }
  };

  const onLeave = async () => {
    setBusy(true);
    setActionErr("");
    try {
      await leaveGroup(id);
      await Promise.all([loadAll(), loadPending(), loadPendingLeadership()]);
    } catch (e) {
      setActionErr(e?.response?.data?.message || "Leave failed");
    } finally {
      setBusy(false);
    }
  };

  const isAdminLike = useMemo(
    () => ["ADMIN", "SYSTEM_ADMIN"].includes(String(user?.role || "").toUpperCase()),
    [user?.role]
  );

  const missingLeadershipRoles = useMemo(() => {
    const activeRoles = new Set(
      (Array.isArray(members) ? members : [])
        .map((m) => String(m?.role || "").toUpperCase())
        .filter(Boolean)
    );
    return LEADERSHIP_ROLES.filter((role) => !activeRoles.has(role));
  }, [members]);

  const activeLeadershipCount = useMemo(
    () => LEADERSHIP_ROLES.length - missingLeadershipRoles.length,
    [missingLeadershipRoles]
  );

  const allStudentsAreMembers = useMemo(
    () => members.length > 0 && activeLeadershipCount === 0,
    [members.length, activeLeadershipCount]
  );

  const showPendingSection = useMemo(
    () => pendingLoading || pendingErr || pending.length > 0,
    [pendingLoading, pendingErr, pending.length]
  );

  const showLeadershipPendingSection = useMemo(
    () =>
      pendingLeadershipLoading ||
      pendingLeadershipErr ||
      pendingLeadershipRequests.length > 0 ||
      (isAdminLike && allStudentsAreMembers),
    [
      pendingLeadershipLoading,
      pendingLeadershipErr,
      pendingLeadershipRequests.length,
      isAdminLike,
      allStudentsAreMembers,
    ]
  );

  const onDecision = async (requestRow, status) => {
    const requestId = requestRow?.request_id;
    if (!requestId) return;

    setDecisionBusyId(requestId);
    setActionErr("");
    try {
      let approvedRole;

      if (status === "APPROVED" && isAdminLike && missingLeadershipRoles.length > 0) {
        const suggestedRole = missingLeadershipRoles[0] || "CAPTAIN";
        const input = window.prompt(
          `Missing leadership roles: ${missingLeadershipRoles.join(", ")}. Approve this request with role (${LEADERSHIP_ROLES.join(", ")}, MEMBER)?`,
          suggestedRole
        );
        if (input === null) {
          setDecisionBusyId(null);
          return;
        }

        approvedRole = String(input || "").trim().toUpperCase();
        const validRoles = [...LEADERSHIP_ROLES, "MEMBER"];
        if (!validRoles.includes(approvedRole)) {
          throw new Error(`Role must be one of: ${validRoles.join(", ")}`);
        }
      }

      const reason =
        status === "APPROVED"
          ? "Approved by captain/admin"
          : "Rejected by captain/admin";
      await decideJoinRequest(requestId, status, reason, approvedRole);
      await Promise.all([loadAll(), loadPending(), loadPendingLeadership()]);
    } catch (e) {
      setActionErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Decision failed"
      );
    } finally {
      setDecisionBusyId(null);
    }
  };

  const onLeadershipDecision = async (requestRow, status) => {
    const requestId = requestRow?.leadership_request_id;
    if (!requestId) return;

    setLeadershipDecisionBusyId(requestId);
    setActionErr("");
    try {
      const reason =
        status === "APPROVED"
          ? "Approved leadership role request by admin"
          : "Rejected leadership role request by admin";
      await decideLeadershipRoleRequest(requestId, status, reason);
      await Promise.all([loadAll(), loadPendingLeadership()]);
    } catch (e) {
      setActionErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Leadership request decision failed"
      );
    } finally {
      setLeadershipDecisionBusyId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading group details...</div>;
  }

  if (err) {
    return (
      <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
        {err}
      </div>
    );
  }

  if (!group) {
    return <div className="p-8 text-sm text-slate-500">Group not found.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 md:px-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-[#f6f9ff] via-[#f2f6ff] to-[#eaf1ff] p-5 shadow-[0_20px_35px_-30px_rgba(15,23,42,0.9)] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Group Workspace
            </p>
            <h1 className="mt-1 text-3xl text-slate-900" style={titleFont}>
              Group Details
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {group.group_code} - ID {group.group_id}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => nav("/groups")}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to Groups
            </button>
            <button
              onClick={() => {
                loadAll();
                loadPending();
                loadPendingLeadership();
              }}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Group Name" value={group.group_name || "-"} />
          <StatCard label="Active Members" value={members.length} />
          <StatCard label="Tier" value={<Badge value={group.tier} />} />
          <StatCard label="Status" value={<Badge value={group.status} />} />
          <StatCard
            label="Leadership Gaps"
            value={missingLeadershipRoles.length === 0 ? "None" : missingLeadershipRoles.join(", ")}
            extra={missingLeadershipRoles.length === 0 ? "All leadership roles assigned" : "Assign missing roles"}
          />
        </div>
      </section>

      {actionErr ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionErr}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.9)]">
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={onJoin}
            className="rounded-xl border border-[#7d95d8] bg-[#e9efff] px-4 py-2 text-sm font-semibold text-[#23366f] transition hover:bg-[#dbe5ff] disabled:opacity-60"
            title="Student only (backend enforces)"
          >
            {busy ? "Working..." : "Join Group"}
          </button>
          <button
            disabled={busy}
            onClick={onLeave}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            title="Student/Captain only (backend enforces)"
          >
            {busy ? "Working..." : "Leave Group"}
          </button>
        </div>
      </section>

      {showLeadershipPendingSection && isAdminLike ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.9)] md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Pending Leadership Requests</h2>
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#e9efff] px-1.5 py-0.5 text-[11px] font-bold text-[#23366f]">
                {pendingLeadershipRequests.length}
              </span>
            </div>
            <button
              onClick={loadPendingLeadership}
              disabled={pendingLeadershipLoading}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {pendingLeadershipLoading ? "Loading..." : "Reload"}
            </button>
          </div>

          {(missingLeadershipRoles.length === LEADERSHIP_ROLES.length || allStudentsAreMembers) ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This group currently has no active leadership role. Students can request leadership roles and admin can validate them here.
            </div>
          ) : null}

          {pendingLeadershipErr ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pendingLeadershipErr}
            </div>
          ) : null}

          <div className="mt-4 space-y-3 md:hidden">
            {pendingLeadershipRequests.map((r) => (
              <article key={r.leadership_request_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{r.student_name || "-"}</p>
                    <p className="text-xs text-slate-500">{r.student_id}</p>
                  </div>
                  <Badge value={r.requested_role} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{formatDateTime(r.request_date)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    disabled={leadershipDecisionBusyId === r.leadership_request_id}
                    onClick={() => onLeadershipDecision(r, "APPROVED")}
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                  >
                    {leadershipDecisionBusyId === r.leadership_request_id ? "..." : "Approve"}
                  </button>
                  <button
                    disabled={leadershipDecisionBusyId === r.leadership_request_id}
                    onClick={() => onLeadershipDecision(r, "REJECTED")}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                  >
                    {leadershipDecisionBusyId === r.leadership_request_id ? "..." : "Reject"}
                  </button>
                </div>
              </article>
            ))}
            {!pendingLeadershipLoading && pendingLeadershipRequests.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                No pending leadership requests.
              </div>
            ) : null}
          </div>

          <div className="mt-4 hidden overflow-auto rounded-xl border border-slate-200 md:block">
            <table className="min-w-[980px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {[
                    "Request ID",
                    "Student ID",
                    "Student",
                    "Requested Role",
                    "Current Role",
                    "Request Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingLeadershipRequests.map((r) => (
                  <tr key={r.leadership_request_id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.leadership_request_id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{r.student_id}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="font-medium text-slate-700">{r.student_name || "-"}</div>
                      <div>{r.student_email || "-"}</div>
                    </td>
                    <td className="px-4 py-3"><Badge value={r.requested_role} /></td>
                    <td className="px-4 py-3"><Badge value={r.current_membership_role || "-"} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(r.request_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          disabled={leadershipDecisionBusyId === r.leadership_request_id}
                          onClick={() => onLeadershipDecision(r, "APPROVED")}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                        >
                          {leadershipDecisionBusyId === r.leadership_request_id ? "..." : "Approve"}
                        </button>
                        <button
                          disabled={leadershipDecisionBusyId === r.leadership_request_id}
                          onClick={() => onLeadershipDecision(r, "REJECTED")}
                          className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                        >
                          {leadershipDecisionBusyId === r.leadership_request_id ? "..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendingLeadershipLoading && pendingLeadershipRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      No pending leadership requests.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {showPendingSection ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.9)] md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Pending Join Requests</h2>
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#fff3d8] px-1.5 py-0.5 text-[11px] font-bold text-[#8a6200]">
                {pending.length}
              </span>
            </div>
            <button
              onClick={loadPending}
              disabled={pendingLoading}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {pendingLoading ? "Loading..." : "Reload"}
            </button>
          </div>

          {pendingErr ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pendingErr}
            </div>
          ) : null}

          {isAdminLike && missingLeadershipRoles.length > 0 && pending.length > 0 ? (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Missing leadership roles: <span className="font-semibold">{missingLeadershipRoles.join(", ")}</span>. Approve and assign roles where needed.
            </div>
          ) : null}

          <div className="mt-4 space-y-3 md:hidden">
            {pending.map((r) => (
              <article key={r.request_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500">Request #{r.request_id}</p>
                    <p className="text-sm font-semibold text-slate-800">{r.student_id}</p>
                  </div>
                  <Badge value={r.status} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{formatDateTime(r.request_date)}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    disabled={decisionBusyId === r.request_id}
                    onClick={() => onDecision(r, "APPROVED")}
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                  >
                    {decisionBusyId === r.request_id ? "..." : "Approve"}
                  </button>
                  <button
                    disabled={decisionBusyId === r.request_id}
                    onClick={() => onDecision(r, "REJECTED")}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                  >
                    {decisionBusyId === r.request_id ? "..." : "Reject"}
                  </button>
                </div>
              </article>
            ))}
            {!pendingLoading && pending.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                No pending join requests.
              </div>
            ) : null}
          </div>

          <div className="mt-4 hidden overflow-auto rounded-xl border border-slate-200 md:block">
            <table className="min-w-[860px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Request ID", "Student ID", "Request Date", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map((r) => (
                  <tr key={r.request_id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.request_id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{r.student_id}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(r.request_date)}</td>
                    <td className="px-4 py-3"><Badge value={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          disabled={decisionBusyId === r.request_id}
                          onClick={() => onDecision(r, "APPROVED")}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                        >
                          {decisionBusyId === r.request_id ? "..." : "Approve"}
                        </button>
                        <button
                          disabled={decisionBusyId === r.request_id}
                          onClick={() => onDecision(r, "REJECTED")}
                          className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                        >
                          {decisionBusyId === r.request_id ? "..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendingLoading && pending.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No pending join requests.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.9)] md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Members</h2>
          <span className="text-xs font-medium text-slate-500">{members.length} active</span>
        </div>
        <GroupMembersTable
          members={members}
          canEditRole={["CAPTAIN", "ADMIN", "SYSTEM_ADMIN"].includes(String(user?.role || "").toUpperCase())}
          canRemoveMember={["CAPTAIN", "ADMIN", "SYSTEM_ADMIN"].includes(String(user?.role || "").toUpperCase())}
          onChanged={loadAll}
          highlightStudentId={highlightStudentId}
          highlightMembershipId={highlightMembershipId}
        />
      </section>
    </div>
  );
}
