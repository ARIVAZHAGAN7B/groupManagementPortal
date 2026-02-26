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

const Badge = ({ value }) => {
  const styles = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    INACTIVE: "bg-gray-100 text-gray-500 border-gray-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    A: "bg-blue-50 text-blue-700 border-blue-200",
    B: "bg-purple-50 text-purple-700 border-purple-200",
    C: "bg-orange-50 text-orange-700 border-orange-200",
    D: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const cls = styles[String(value).toUpperCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold ${cls}`}>
      {value}
    </span>
  );
};

const LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];

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
      setGroup(g);
      setMembers(Array.isArray(m) ? m : []);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load group"
      );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const onDecision = async (requestRow, status) => {
    const requestId = requestRow?.request_id;
    if (!requestId) return;

    setDecisionBusyId(requestId);
    setActionErr("");
    try {
      let approvedRole;

      if (status === "APPROVED" && isAdminLike && missingLeadershipRoles.length > 0) {
        const suggestedRole =
          missingLeadershipRoles[0] || "CAPTAIN";
        const input = window.prompt(
          `Missing leadership roles: ${missingLeadershipRoles.join(", ")}. Approve this request with role (${LEADERSHIP_ROLES.join(", ")}, MEMBER)?`,
          suggestedRole
        );
        if (input === null) {
          setDecisionBusyId(null);
          return;
        }

        approvedRole = String(input || "")
          .trim()
          .toUpperCase();

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

  const showPendingSection = useMemo(
    () => pendingLoading || pendingErr || pending.length > 0,
    [pendingLoading, pendingErr, pending.length]
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

  const allLeadershipRolesEmpty = useMemo(
    () => missingLeadershipRoles.length === LEADERSHIP_ROLES.length,
    [missingLeadershipRoles]
  );

  const allStudentsAreMembers = useMemo(
    () => members.length > 0 && activeLeadershipCount === 0,
    [members.length, activeLeadershipCount]
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
      allStudentsAreMembers
    ]
  );

  if (loading)
    return (
      <div className="p-8 text-sm text-gray-400">Loading group details…</div>
    );
  if (err)
    return (
      <div className="p-8 text-sm text-red-600 bg-red-50 rounded-lg m-6">{err}</div>
    );
  if (!group)
    return (
      <div className="p-8 text-sm text-gray-400">Group not found.</div>
    );

  return (
    <div className="p-6 space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Group Details</h1>
          <p className="text-xs text-gray-400 mt-0.5">{group.group_code} · {group.group_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/groups")}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              loadAll();
              loadPending();
              loadPendingLeadership();
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
        {[
          { label: "Name", value: group.group_name },
          { label: "Active Members", value: members.length },
          { label: "Tier", value: <Badge value={group.tier} /> },
          { label: "Status", value: <Badge value={group.status} /> },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {actionErr && (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {actionErr}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={onJoin}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          title="Student only (backend enforces)"
        >
          {busy ? "Working…" : "Join Group"}
        </button>
        <button
          disabled={busy}
          onClick={onLeave}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          title="Student/Captain only (backend enforces)"
        >
          {busy ? "Working…" : "Leave Group"}
        </button>
      </div>

      {/* Leadership Recovery Requests */}
      {showLeadershipPendingSection && isAdminLike && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">Pending Leadership Role Requests</h2>
              {pendingLeadershipRequests.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {pendingLeadershipRequests.length}
                </span>
              )}
            </div>
            <button
              onClick={loadPendingLeadership}
              disabled={pendingLeadershipLoading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {pendingLeadershipLoading ? "Loading..." : "Reload"}
            </button>
          </div>

          {(allLeadershipRolesEmpty || allStudentsAreMembers) && (
            <div className="px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
              Admin notification: this group has no active leadership roles (all students are members).
              Students can request a leadership role from their My Group page, and you can validate it here.
            </div>
          )}

          {pendingLeadershipErr && (
            <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
              {pendingLeadershipErr}
            </div>
          )}

          <div className="overflow-auto rounded-xl border border-gray-100">
            <table className="min-w-[980px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Request ID",
                    "Student ID",
                    "Student",
                    "Requested Role",
                    "Current Role",
                    "Request Date",
                    "Actions"
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingLeadershipRequests.map((r) => (
                  <tr key={r.leadership_request_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {r.leadership_request_id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{r.student_id}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div className="font-medium text-gray-700">{r.student_name || "-"}</div>
                      <div>{r.student_email || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={r.requested_role} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={r.current_membership_role || "-"} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.request_date ? new Date(r.request_date).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          disabled={leadershipDecisionBusyId === r.leadership_request_id}
                          onClick={() => onLeadershipDecision(r, "APPROVED")}
                          className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {leadershipDecisionBusyId === r.leadership_request_id ? "..." : "Approve"}
                        </button>
                        <button
                          disabled={leadershipDecisionBusyId === r.leadership_request_id}
                          onClick={() => onLeadershipDecision(r, "REJECTED")}
                          className="px-3 py-1 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          {leadershipDecisionBusyId === r.leadership_request_id ? "..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendingLeadershipLoading && pendingLeadershipRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">
                      No pending leadership role requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {showPendingSection && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">Pending Join Requests</h2>
              {pending.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                  {pending.length}
                </span>
              )}
            </div>
            <button
              onClick={loadPending}
              disabled={pendingLoading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {pendingLoading ? "Loading…" : "Reload"}
            </button>
          </div>

          {pendingErr && (
            <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
              {pendingErr}
            </div>
          )}

          {isAdminLike && missingLeadershipRoles.length > 0 && pending.length > 0 && (
            <div className="px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-700">
              Missing leadership roles: <span className="font-semibold">{missingLeadershipRoles.join(", ")}</span>.
              Approve pending requests and assign leadership roles so the group can be activated.
            </div>
          )}

          <div className="overflow-auto rounded-xl border border-gray-100">
            <table className="min-w-[860px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Request ID", "Student ID", "Request Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pending.map((r) => (
                  <tr key={r.request_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{r.request_id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{r.student_id}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.request_date ? new Date(r.request_date).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          disabled={decisionBusyId === r.request_id}
                          onClick={() => onDecision(r, "APPROVED")}
                          className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {decisionBusyId === r.request_id ? "…" : "Approve"}
                        </button>
                        <button
                          disabled={decisionBusyId === r.request_id}
                          onClick={() => onDecision(r, "REJECTED")}
                          className="px-3 py-1 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          {decisionBusyId === r.request_id ? "…" : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendingLoading && pending.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                      No pending requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900">
          Members
          <span className="ml-2 text-xs font-medium text-gray-400">{members.length}</span>
        </h2>
        <GroupMembersTable
          members={members}
          canEditRole={["CAPTAIN", "ADMIN", "SYSTEM_ADMIN"].includes(user.role)}
          canRemoveMember={["CAPTAIN", "ADMIN", "SYSTEM_ADMIN"].includes(user.role)}
          onChanged={loadAll}
          highlightStudentId={highlightStudentId}
          highlightMembershipId={highlightMembershipId}
        />
      </div>
    </div>
  );
}
