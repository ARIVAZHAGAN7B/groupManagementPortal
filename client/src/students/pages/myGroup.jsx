import { useCallback, useEffect, useMemo, useState } from "react";
import GroupMembersTable from "../../admin/components/membership/GroupMembersTable";
import {
  fetchGroupMembers,
  fetchMyGroup,
  leaveGroup
} from "../../service/membership.api";
import {
  decideJoinRequest,
  getPendingRequestsByGroup
} from "../../service/joinRequests.api";
import { fetchCurrentPhase } from "../../service/phase.api";
import { fetchGroupEligibilitySummary } from "../../service/eligibility.api";
import {
  applyLeadershipRoleRequest,
  getMyLeadershipRoleRequests
} from "../../service/leadershipRequests.api";

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const BADGE_STYLES = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  FROZEN: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CAPTAIN: "bg-blue-50 text-blue-700 border-blue-200",
  VICE_CAPTAIN: "bg-purple-50 text-purple-700 border-purple-200",
  STRATEGIST: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
  MEMBER: "bg-gray-100 text-gray-700 border-gray-200",
  TIER_A: "bg-blue-50 text-blue-700 border-blue-200",
  TIER_B: "bg-purple-50 text-purple-700 border-purple-200",
  TIER_C: "bg-orange-50 text-orange-700 border-orange-200",
  TIER_D: "bg-gray-100 text-gray-700 border-gray-200",
  YES: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NO: "bg-red-50 text-red-700 border-red-200",
  NOT_AVAILABLE: "bg-gray-100 text-gray-600 border-gray-200"
};

const LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];

const Badge = ({ value, fallback = "-" }) => {
  const text = String(value || fallback);
  const key = text.toUpperCase().replace(/\s+/g, "_");
  const cls = BADGE_STYLES[key] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
};

const StatCard = ({ label, value, tone = "text-gray-900", subtext = null }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
    <div className={`mt-2 text-lg font-bold ${tone}`}>{value}</div>
    {subtext ? <div className="mt-1 text-xs text-gray-500">{subtext}</div> : null}
  </div>
);

const MyGroup = () => {
  const [data, setData] = useState(null);
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);
  const [decisionBusyId, setDecisionBusyId] = useState(null);
  const [actionErr, setActionErr] = useState("");
  const [activeTab, setActiveTab] = useState("members");
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityErr, setEligibilityErr] = useState("");
  const [leadershipRequests, setLeadershipRequests] = useState([]);
  const [leadershipRoleBusy, setLeadershipRoleBusy] = useState(false);
  const [selectedLeadershipRole, setSelectedLeadershipRole] = useState("CAPTAIN");
  const [leadershipRequestReason, setLeadershipRequestReason] = useState("");

  const isCaptain = data?.role === "CAPTAIN";
  const pendingCount = pending.length;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const groupRes = await fetchMyGroup();
      const myGroup = groupRes?.group ?? null;
      setData(myGroup);

      if (!myGroup) {
        setMembers([]);
        setPending([]);
        setLeadershipRequests([]);
        setEligibility(null);
        setEligibilityErr("");
        return;
      }

      const [memberData, pendingData, leadershipRequestData] = await Promise.all([
        fetchGroupMembers(myGroup.group_id),
        myGroup.role === "CAPTAIN"
          ? getPendingRequestsByGroup(myGroup.group_id)
          : Promise.resolve([]),
        getMyLeadershipRoleRequests().catch(() => [])
      ]);

      setMembers(Array.isArray(memberData) ? memberData : []);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setLeadershipRequests(
        (Array.isArray(leadershipRequestData) ? leadershipRequestData : []).filter(
          (row) => String(row?.group_id) === String(myGroup.group_id)
        )
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load group details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadEligibility = useCallback(async () => {
    if (!data?.group_id) return;

    setEligibilityLoading(true);
    setEligibilityErr("");
    try {
      const phase = await fetchCurrentPhase();
      if (!phase?.phase_id) {
        setEligibility({
          phase_id: null,
          phase_name: null,
          earned_points: 0,
          target_points: null,
          is_eligible: null
        });
        return;
      }

      const summary = await fetchGroupEligibilitySummary(phase.phase_id, data.group_id);
      setEligibility(summary || null);
    } catch (err) {
      setEligibilityErr(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load eligibility."
      );
      setEligibility(null);
    } finally {
      setEligibilityLoading(false);
    }
  }, [data?.group_id]);

  useEffect(() => {
    if (activeTab !== "eligibility") return;
    if (!data?.group_id) return;
    loadEligibility();
  }, [activeTab, data?.group_id, loadEligibility]);

  useEffect(() => {
    if (!isCaptain && activeTab === "requests") {
      setActiveTab("members");
    }
  }, [isCaptain, activeTab]);

  const onLeave = async () => {
    if (!data?.group_id) return;
    const ok = window.confirm("Leave your current group?");
    if (!ok) return;

    setBusy(true);
    setActionErr("");
    try {
      await leaveGroup(data.group_id);
      await load();
    } catch (err) {
      setActionErr(err?.response?.data?.message || "Failed to leave group.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmitLeadershipRoleRequest = async () => {
    if (!data?.group_id) return;
    if (!selectedLeadershipRole) return;

    setLeadershipRoleBusy(true);
    setActionErr("");
    try {
      await applyLeadershipRoleRequest({
        group_id: data.group_id,
        requested_role: selectedLeadershipRole,
        request_reason: leadershipRequestReason.trim()
      });
      setLeadershipRequestReason("");
      await load();
    } catch (err) {
      setActionErr(
        err?.response?.data?.message || "Failed to submit leadership role request."
      );
    } finally {
      setLeadershipRoleBusy(false);
    }
  };

  const onDecision = async (requestId, status) => {
    setDecisionBusyId(requestId);
    setActionErr("");
    try {
      const reason =
        status === "APPROVED"
          ? "Approved by group captain"
          : "Rejected by group captain";
      await decideJoinRequest(requestId, status, reason);
      await load();
    } catch (err) {
      setActionErr(err?.response?.data?.message || "Failed to update request.");
    } finally {
      setDecisionBusyId(null);
    }
  };

  const eligibilityLabel = useMemo(() => {
    if (eligibility?.is_eligible === true) return "Yes";
    if (eligibility?.is_eligible === false) return "No";
    return "Not available";
  }, [eligibility]);

  const activeLeadershipCount = useMemo(
    () =>
      (Array.isArray(members) ? members : []).filter((member) =>
        LEADERSHIP_ROLES.includes(String(member?.role || "").toUpperCase())
      ).length,
    [members]
  );

  const missingLeadershipRoles = useMemo(() => {
    const occupied = new Set(
      (Array.isArray(members) ? members : [])
        .map((member) => String(member?.role || "").toUpperCase())
        .filter((role) => LEADERSHIP_ROLES.includes(role))
    );

    return LEADERSHIP_ROLES.filter((role) => !occupied.has(role));
  }, [members]);

  useEffect(() => {
    if (missingLeadershipRoles.length === 0) return;
    if (!missingLeadershipRoles.includes(selectedLeadershipRole)) {
      setSelectedLeadershipRole(missingLeadershipRoles[0]);
    }
  }, [missingLeadershipRoles, selectedLeadershipRole]);

  const myPendingLeadershipRoleRequests = useMemo(
    () =>
      (Array.isArray(leadershipRequests) ? leadershipRequests : []).filter(
        (row) => String(row?.status || "").toUpperCase() === "PENDING"
      ),
    [leadershipRequests]
  );

  const canRequestLeadershipRole = useMemo(
    () =>
      data?.role === "MEMBER" &&
      missingLeadershipRoles.length > 0 &&
      myPendingLeadershipRoleRequests.length === 0,
    [data?.role, missingLeadershipRoles, myPendingLeadershipRoleRequests.length]
  );

  const tabs = useMemo(
    () => [
      { key: "members", label: "Members", count: members.length },
      { key: "eligibility", label: "Eligibility", count: null },
      ...(isCaptain ? [{ key: "requests", label: "Join Requests", count: pendingCount }] : [])
    ],
    [isCaptain, members.length, pendingCount]
  );

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Loading my group...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">My Group</h1>
          <p className="mt-2 text-gray-600">You are not part of any group yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-screen-2xl">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">My Group</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{data.group_name || "Group"}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage members, captain requests, and current phase eligibility from one place.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge value={`Tier ${data.tier || "-"}`} />
              <Badge value={data.group_status || "Unknown"} />
              <Badge value={data.role || "Member"} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {loading ? (
              <span className="text-xs font-medium text-blue-700">Refreshing group...</span>
            ) : null}
            <button
              onClick={load}
              disabled={busy || decisionBusyId !== null || loading}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={onLeave}
              disabled={busy || decisionBusyId !== null || loading}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              {busy ? "Leaving..." : "Leave Group"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard label="Members" value={Number(data.member_count || members.length || 0)} />
          <StatCard label="My Role" value={data.role || "-"} tone="text-blue-700" />
          <StatCard label="Group Status" value={data.group_status || "-"} />
          {isCaptain ? (
            <StatCard
              label="Pending Join Requests"
              value={pendingCount}
              tone={pendingCount > 0 ? "text-amber-700" : "text-gray-900"}
              subtext={pendingCount > 0 ? "Review them in Join Requests tab" : "No pending requests"}
            />
          ) : (
            <StatCard
              label="Eligibility"
              value={eligibilityLabel}
              tone={
                eligibility?.is_eligible === true
                  ? "text-green-700"
                  : eligibility?.is_eligible === false
                    ? "text-red-700"
                    : "text-gray-900"
              }
              subtext="Open Eligibility tab for full details"
            />
          )}
        </div>
      </div>

      {actionErr ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {actionErr}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50/70 px-4 py-3">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-blue-200 bg-blue-100 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {typeof tab.count === "number" ? (
                      <span
                        className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                          active ? "bg-white/90 text-blue-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {activeTab === "eligibility" ? (
                <div className="flex items-center gap-2">
                  {eligibilityLoading ? (
                    <span className="text-xs font-medium text-blue-700">Refreshing...</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={loadEligibility}
                    disabled={eligibilityLoading || !data?.group_id}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {eligibilityLoading ? "Loading..." : "Refresh Eligibility"}
                  </button>
                </div>
              ) : null}
              {activeTab === "requests" && isCaptain ? (
                <button
                  type="button"
                  onClick={load}
                  disabled={busy || decisionBusyId !== null || loading}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {loading ? "Refreshing..." : "Reload Requests"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === "members" ? (
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Group Members</h2>
                  <p className="text-sm text-gray-500">
                    {isCaptain
                      ? "Update member roles directly from this table."
                      : "View all active members in your current group."}
                  </p>
                </div>
              </div>

              {(missingLeadershipRoles.length > 0 || leadershipRequests.length > 0) && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">
                      Leadership Role Recovery
                    </h3>
                    <p className="mt-1 text-xs text-blue-800">
                      Missing leadership roles: {missingLeadershipRoles.length > 0
                        ? missingLeadershipRoles.join(", ")
                        : "None"}.
                      {" "}
                      {activeLeadershipCount === 0
                        ? "No leadership roles are currently occupied, so admin has been alerted."
                        : "Admin approval is required before a role request is applied."}
                    </p>
                  </div>

                  {canRequestLeadershipRole ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_auto] gap-2 items-start">
                      <select
                        value={selectedLeadershipRole}
                        onChange={(e) => setSelectedLeadershipRole(e.target.value)}
                        disabled={leadershipRoleBusy}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800"
                      >
                        {missingLeadershipRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={leadershipRequestReason}
                        onChange={(e) => setLeadershipRequestReason(e.target.value)}
                        disabled={leadershipRoleBusy}
                        placeholder="Optional note for admin (why you fit this role)"
                        maxLength={255}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800"
                      />

                      <button
                        type="button"
                        onClick={onSubmitLeadershipRoleRequest}
                        disabled={leadershipRoleBusy || !selectedLeadershipRole}
                        className="rounded-lg border border-blue-300 bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {leadershipRoleBusy ? "Sending..." : "Send Role Request"}
                      </button>
                    </div>
                  ) : data?.role !== "MEMBER" ? (
                    <div className="text-xs text-blue-800">
                      Leadership role requests are available for members. Captains/admin can assign roles directly.
                    </div>
                  ) : myPendingLeadershipRoleRequests.length > 0 ? (
                    <div className="text-xs text-blue-800">
                      You already have a pending leadership role request. Wait for admin validation.
                    </div>
                  ) : null}

                  {leadershipRequests.length > 0 && (
                    <div className="overflow-auto rounded-lg border border-blue-100 bg-white">
                      <table className="min-w-[720px] w-full text-sm">
                        <thead className="bg-blue-50/60">
                          <tr>
                            <th className="text-left p-2.5 border-b border-blue-100 text-xs">Request ID</th>
                            <th className="text-left p-2.5 border-b border-blue-100 text-xs">Requested Role</th>
                            <th className="text-left p-2.5 border-b border-blue-100 text-xs">Status</th>
                            <th className="text-left p-2.5 border-b border-blue-100 text-xs">Request Date</th>
                            <th className="text-left p-2.5 border-b border-blue-100 text-xs">Decision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leadershipRequests.map((row) => (
                            <tr key={row.leadership_request_id} className="hover:bg-gray-50">
                              <td className="p-2.5 border-b border-gray-100">{row.leadership_request_id}</td>
                              <td className="p-2.5 border-b border-gray-100">
                                <Badge value={row.requested_role || "-"} />
                              </td>
                              <td className="p-2.5 border-b border-gray-100">
                                <Badge value={row.status || "-"} />
                              </td>
                              <td className="p-2.5 border-b border-gray-100">
                                {formatDateTime(row.request_date)}
                              </td>
                              <td className="p-2.5 border-b border-gray-100 text-xs text-gray-600">
                                {row.decision_reason || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <GroupMembersTable
                members={members}
                canEditRole={isCaptain}
                canRemoveMember={isCaptain}
                canRemoveRow={(row) => String(row?.student_id) !== String(data?.student_id)}
                onChanged={load}
                highlightStudentId={data?.student_id || null}
                showMembershipId={false}
              />
            </div>
          ) : activeTab === "eligibility" ? (
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Eligibility</h2>
                <p className="text-sm text-gray-500">
                  Current phase group eligibility summary and target progress.
                </p>
              </div>

              {eligibilityErr ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                  {eligibilityErr}
                </div>
              ) : null}

              {eligibilityLoading && !eligibility ? (
                <div className="p-3 border rounded">Loading eligibility...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <StatCard
                    label="Phase"
                    value={eligibility?.phase_name || eligibility?.phase_id || "No active phase"}
                    subtext="Current phase"
                  />
                  <StatCard
                    label="Earned Points"
                    value={Number(eligibility?.earned_points ?? 0)}
                    tone="text-blue-700"
                    subtext="Points earned by the group"
                  />
                  <StatCard
                    label="Target Points"
                    value={
                      eligibility?.target_points === null || eligibility?.target_points === undefined
                        ? "Not set"
                        : Number(eligibility.target_points)
                    }
                    subtext="Configured target for your tier"
                  />
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Eligible
                    </div>
                    <div className="mt-2">
                      <Badge value={eligibilityLabel} />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {eligibility?.is_eligible === true
                        ? "Your group has met the current target."
                        : eligibility?.is_eligible === false
                          ? "Your group has not met the current target yet."
                          : "Eligibility is not available right now."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pending Join Requests</h2>
                <p className="text-sm text-gray-500">
                  Review student requests to join your group.
                </p>
              </div>

              <div className="overflow-auto rounded-xl border border-gray-100">
                <table className="min-w-[820px] w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 border-b">Student ID</th>
                      <th className="text-left p-3 border-b">Request Date</th>
                      <th className="text-left p-3 border-b">Status</th>
                      <th className="text-left p-3 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((row) => (
                      <tr key={row.request_id} className="hover:bg-gray-50">
                        <td className="p-3 border-b">{row.student_id}</td>
                        <td className="p-3 border-b">{formatDate(row.request_date)}</td>
                        <td className="p-3 border-b">
                          <Badge value={row.status || "-"} />
                        </td>
                        <td className="p-3 border-b">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => onDecision(row.request_id, "APPROVED")}
                              disabled={decisionBusyId === row.request_id || busy}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                            >
                              {decisionBusyId === row.request_id ? "Working..." : "Approve"}
                            </button>
                            <button
                              onClick={() => onDecision(row.request_id, "REJECTED")}
                              disabled={decisionBusyId === row.request_id || busy}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                            >
                              {decisionBusyId === row.request_id ? "Working..." : "Reject"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {pending.length === 0 ? (
                      <tr>
                        <td className="p-4 text-gray-500" colSpan={4}>
                          No pending requests.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyGroup;
