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

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

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

  const isCaptain = data?.role === "CAPTAIN";

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
        setEligibility(null);
        setEligibilityErr("");
        return;
      }

      const [memberData, pendingData] = await Promise.all([
        fetchGroupMembers(myGroup.group_id),
        myGroup.role === "CAPTAIN"
          ? getPendingRequestsByGroup(myGroup.group_id)
          : Promise.resolve([])
      ]);

      setMembers(Array.isArray(memberData) ? memberData : []);
      setPending(Array.isArray(pendingData) ? pendingData : []);
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

  const items = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Group Name", value: data.group_name },
      { label: "Group Code", value: data.group_code },
      { label: "Tier", value: data.tier },
      { label: "Group Status", value: data.group_status },
      { label: "My Role", value: data.role },
      { label: "Joined On", value: formatDate(data.join_date) },
      { label: "Members", value: data.member_count }
    ];
  }, [data]);

  if (loading) {
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
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-gray-900">My Group</h1>
          <p className="mt-2 text-gray-600">You are not part of any group yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Group</h1>
            <p className="mt-1 text-sm text-gray-500">
              Details for your current active group.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={busy || decisionBusyId !== null}
              className="rounded border px-3 py-2 text-sm"
            >
              Refresh
            </button>
            <button
              onClick={onLeave}
              disabled={busy || decisionBusyId !== null}
              className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {busy ? "Leaving..." : "Leave Group"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {item.label}
              </div>
              <div className="mt-2 text-base font-semibold text-gray-900">
                {item.value ?? "-"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {actionErr ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {actionErr}
        </div>
      ) : null}

      {isCaptain ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Pending Join Requests</h2>
            <button
              onClick={load}
              disabled={busy || decisionBusyId !== null}
              className="rounded border px-3 py-2 text-sm"
            >
              Reload
            </button>
          </div>

          <div className="overflow-auto border rounded">
            <table className="min-w-[820px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 border-b">Request ID</th>
                  <th className="text-left p-3 border-b">Student ID</th>
                  <th className="text-left p-3 border-b">Request Date</th>
                  <th className="text-left p-3 border-b">Status</th>
                  <th className="text-left p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((row) => (
                  <tr key={row.request_id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{row.request_id}</td>
                    <td className="p-3 border-b">{row.student_id}</td>
                    <td className="p-3 border-b">{formatDateTime(row.request_date)}</td>
                    <td className="p-3 border-b">{row.status}</td>
                    <td className="p-3 border-b">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onDecision(row.request_id, "APPROVED")}
                          disabled={decisionBusyId === row.request_id || busy}
                          className="rounded border px-3 py-1"
                        >
                          {decisionBusyId === row.request_id ? "Working..." : "Approve"}
                        </button>
                        <button
                          onClick={() => onDecision(row.request_id, "REJECTED")}
                          disabled={decisionBusyId === row.request_id || busy}
                          className="rounded border px-3 py-1"
                        >
                          {decisionBusyId === row.request_id ? "Working..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pending.length === 0 ? (
                  <tr>
                    <td className="p-3" colSpan={5}>
                      No pending requests.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-4 py-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`px-3 py-1.5 rounded text-sm font-semibold border ${
              activeTab === "members"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Members
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("eligibility")}
            className={`px-3 py-1.5 rounded text-sm font-semibold border ${
              activeTab === "eligibility"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Eligibility
          </button>
        </div>

        <div className="p-6">
          {activeTab === "members" ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Group Members</h2>
              <GroupMembersTable
                members={members}
                canEditRole={isCaptain}
                onChanged={load}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Eligibility</h2>
                <button
                  type="button"
                  onClick={loadEligibility}
                  disabled={eligibilityLoading || !data?.group_id}
                  className="rounded border px-3 py-2 text-sm"
                >
                  {eligibilityLoading ? "Loading..." : "Refresh Eligibility"}
                </button>
              </div>

              {eligibilityErr ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                  {eligibilityErr}
                </div>
              ) : null}

              {eligibilityLoading ? (
                <div className="p-3 border rounded">Loading eligibility...</div>
              ) : (
                <div className="overflow-auto border rounded">
                  <table className="min-w-[640px] w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 border-b">Phase ID</th>
                        <th className="text-left p-3 border-b">Earned</th>
                        <th className="text-left p-3 border-b">Target</th>
                        <th className="text-left p-3 border-b">Eligible</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-b break-all">
                          {eligibility?.phase_id || "No active phase"}
                        </td>
                        <td className="p-3 border-b">{eligibility?.earned_points ?? 0}</td>
                        <td className="p-3 border-b">{eligibility?.target_points ?? "Not set"}</td>
                        <td
                          className={`p-3 border-b font-semibold ${
                            eligibility?.is_eligible === true
                              ? "text-green-700"
                              : eligibility?.is_eligible === false
                                ? "text-red-700"
                                : "text-gray-700"
                          }`}
                        >
                          {eligibility?.is_eligible === true
                            ? "Yes"
                            : eligibility?.is_eligible === false
                              ? "No"
                              : "Not available"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyGroup;
