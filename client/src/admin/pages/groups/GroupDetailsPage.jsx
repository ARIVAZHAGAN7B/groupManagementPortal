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

export default function GroupDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState("");

  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingErr, setPendingErr] = useState("");
  const [decisionBusyId, setDecisionBusyId] = useState(null);

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

  useEffect(() => {
    loadAll();
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onJoin = async () => {
    setBusy(true);
    setActionErr("");
    try {
      await joinGroup(id);
      await Promise.all([loadAll(), loadPending()]);
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
      await Promise.all([loadAll(), loadPending()]);
    } catch (e) {
      setActionErr(e?.response?.data?.message || "Leave failed");
    } finally {
      setBusy(false);
    }
  };

  const onDecision = async (requestId, status) => {
    setDecisionBusyId(requestId);
    setActionErr("");
    try {
      const reason =
        status === "APPROVED"
          ? "Approved by captain/admin"
          : "Rejected by captain/admin";
      await decideJoinRequest(requestId, status, reason);
      await Promise.all([loadAll(), loadPending()]);
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

  const showPendingSection = useMemo(
    () => pendingLoading || pendingErr || pending.length > 0,
    [pendingLoading, pendingErr, pending.length]
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
            onClick={() => { loadAll(); loadPending(); }}
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
      {(highlightStudentId || highlightMembershipId) && (
        <div className="px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
          Highlighted member from Membership Management.
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
                          onClick={() => onDecision(r.request_id, "APPROVED")}
                          className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {decisionBusyId === r.request_id ? "…" : "Approve"}
                        </button>
                        <button
                          disabled={decisionBusyId === r.request_id}
                          onClick={() => onDecision(r.request_id, "REJECTED")}
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
          onChanged={loadAll}
          highlightStudentId={highlightStudentId}
          highlightMembershipId={highlightMembershipId}
        />
      </div>
    </div>
  );
}