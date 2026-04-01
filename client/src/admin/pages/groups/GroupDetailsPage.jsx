import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useRealtimeEvents } from "../../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS, matchesRealtimeScope } from "../../../lib/realtime";
import { fetchGroupById } from "../../../service/groups.api";
import { useAuth } from "../../../utils/AuthContext";

import {
  fetchGroupMembers,
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

import {
  getStatusConfig,
  getTierBadgeClass,
} from "../../components/groups/groupManagement.constants";

const REQUEST_BADGE_STYLES = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

const ROLE_BADGE_STYLES = {
  CAPTAIN: "border-amber-300 bg-amber-50 text-amber-800",
  VICE_CAPTAIN: "border-violet-200 bg-violet-50 text-violet-700",
  STRATEGIST: "border-blue-200 bg-blue-50 text-blue-700",
  MANAGER: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-700",
};

const LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];
const LEADERSHIP_ROLE_SHORT_LABELS = {
  CAPTAIN: "C",
  VICE_CAPTAIN: "VC",
  STRATEGIST: "SRT",
  MANAGER: "MGR",
};
const badgeBaseClass =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold";

const RoleBadge = ({ value }) => {
  const text = String(value || "-");
  const key = text.toUpperCase();
  const cls = ROLE_BADGE_STYLES[key] || "border-slate-200 bg-slate-100 text-slate-600";
  return <span className={`${badgeBaseClass} ${cls}`}>{text}</span>;
};

const RequestStatusBadge = ({ value }) => {
  const text = String(value || "-");
  const key = text.toUpperCase();
  const cls = REQUEST_BADGE_STYLES[key] || "border-slate-200 bg-slate-100 text-slate-600";
  return <span className={`${badgeBaseClass} ${cls}`}>{text}</span>;
};

const TierBadge = ({ value }) => (
  <span className={`${badgeBaseClass} ${getTierBadgeClass(value)}`}>
    Tier {String(value || "-").toUpperCase()}
  </span>
);

const StatusBadge = ({ value }) => {
  const config = getStatusConfig(value);

  return (
    <span className={`inline-flex items-center gap-2 text-sm font-bold ${config.text}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const LeadershipGapChips = ({ roles }) => {
  if (!Array.isArray(roles) || roles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => {
        const normalizedRole = String(role || "").toUpperCase();

        return (
          <div
            key={normalizedRole}
            title={normalizedRole.replace("_", " ")}
            className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-red-600 bg-white text-[9px] font-extrabold tracking-[0.02em] text-black-700"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[-6px] right-[-6px] top-1/2 z-0 h-[2px] -translate-y-1/2 -rotate-[28deg] bg-red-600"
            />
            <span className="relative z-10">
              {LEADERSHIP_ROLE_SHORT_LABELS[normalizedRole] || normalizedRole}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const SectionCard = ({ action, children, count, countClassName, title }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {typeof count === "number" ? (
          <span
            className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${countClassName || "bg-slate-100 text-slate-700"}`}
          >
            {count}
          </span>
        ) : null}
      </div>
      {action}
    </div>
    <div className="p-4 md:p-6">{children}</div>
  </section>
);

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const formatMetric = (value) => (Number(value) || 0).toLocaleString();

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

  useRealtimeEvents(
    [
      REALTIME_EVENTS.JOIN_REQUESTS,
      REALTIME_EVENTS.LEADERSHIP_REQUESTS,
      REALTIME_EVENTS.MEMBERSHIPS,
      REALTIME_EVENTS.POINTS,
      REALTIME_EVENTS.ELIGIBILITY
    ],
    (payload) => {
      if (!matchesRealtimeScope(payload, { groupId: id })) return;

      void loadAll();
      void loadPending();
      void loadPendingLeadership();
    }
  );

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
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 font-[Inter] md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading group details...
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 font-[Inter] md:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
          {err}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 font-[Inter] md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Group not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] md:px-6">
      <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Group Workspace
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Group Details</h1>
            <p className="mt-2 text-xl font-bold text-slate-900">{group.group_name || "-"}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-[#1754cf]">
                {group.group_code || "No code"}
              </span>
              <TierBadge value={group.tier} />
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1">
                <StatusBadge value={group.status} />
              </span>
              <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                {members.length} Active
              </span>
              <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                Base {formatMetric(group?.lifetime_base_points)}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-[#1754cf]">
                Bonus {formatMetric(group?.eligibility_bonus_points)}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                Total {formatMetric(group?.lifetime_total_points)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => nav("/groups")}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
                Back to Groups
              </button>
              <button
                type="button"
                onClick={() => {
                  loadAll();
                  loadPending();
                  loadPendingLeadership();
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                Refresh
              </button>
            </div>

            {missingLeadershipRoles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 lg:justify-end">
                <LeadershipGapChips roles={missingLeadershipRoles} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
      </section>

      {actionErr ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionErr}
        </div>
      ) : null}

      {showLeadershipPendingSection && isAdminLike ? (
        <SectionCard
          title="Pending Leadership Requests"
          count={pendingLeadershipRequests.length}
          countClassName="bg-[#e9efff] text-[#23366f]"
          action={
            <button
              type="button"
              onClick={loadPendingLeadership}
              disabled={pendingLeadershipLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              {pendingLeadershipLoading ? "Loading..." : "Refresh"}
            </button>
          }
        >

          {(missingLeadershipRoles.length === LEADERSHIP_ROLES.length || allStudentsAreMembers) ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              No active leadership role assigned.
            </div>
          ) : null}

          {pendingLeadershipErr ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pendingLeadershipErr}
            </div>
          ) : null}

          <div className="mt-4 space-y-3 md:hidden">
            {pendingLeadershipRequests.map((r) => (
              <article key={r.leadership_request_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.student_name || "-"}</p>
                    <p className="text-xs text-slate-500">{r.student_id}</p>
                  </div>
                  <RoleBadge value={r.requested_role} />
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
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
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
                    <td className="px-4 py-3"><RoleBadge value={r.requested_role} /></td>
                    <td className="px-4 py-3"><RoleBadge value={r.current_membership_role || "-"} /></td>
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
        </SectionCard>
      ) : null}

      {showPendingSection ? (
        <SectionCard
          title="Pending Join Requests"
          count={pending.length}
          countClassName="bg-[#fff3d8] text-[#8a6200]"
          action={
            <button
              type="button"
              onClick={loadPending}
              disabled={pendingLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              {pendingLoading ? "Loading..." : "Refresh"}
            </button>
          }
        >

          {pendingErr ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pendingErr}
            </div>
          ) : null}

          {isAdminLike && missingLeadershipRoles.length > 0 && pending.length > 0 ? (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Missing roles: <span className="font-semibold">{missingLeadershipRoles.join(", ")}</span>
            </div>
          ) : null}

          <div className="mt-4 space-y-3 md:hidden">
            {pending.map((r) => (
              <article key={r.request_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500">Request #{r.request_id}</p>
                    <p className="text-sm font-semibold text-slate-800">{r.student_id}</p>
                  </div>
                  <RequestStatusBadge value={r.status} />
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
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
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
                    <td className="px-4 py-3"><RequestStatusBadge value={r.status} /></td>
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
        </SectionCard>
      ) : null}

      <SectionCard
        title="Members"
        action={
          <span className="text-xs font-medium text-slate-500">{members.length} active</span>
        }
      >
        <GroupMembersTable
          members={members}
          canEditRole={["CAPTAIN", "ADMIN", "SYSTEM_ADMIN"].includes(String(user?.role || "").toUpperCase())}
          canEditRank={["CAPTAIN", "ADMIN", "SYSTEM_ADMIN"].includes(String(user?.role || "").toUpperCase())}
          canRemoveMember={["CAPTAIN", "ADMIN", "SYSTEM_ADMIN"].includes(String(user?.role || "").toUpperCase())}
          onChanged={loadAll}
          highlightStudentId={highlightStudentId}
          highlightMembershipId={highlightMembershipId}
          showMembershipId={false}
          showRankCriteria={false}
        />
      </SectionCard>
    </div>
  );
}
