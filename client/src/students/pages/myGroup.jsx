import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchGroupMembers,
  fetchMyGroup,
  leaveGroup
} from "../../service/membership.api";
import {
  decideJoinRequest,
  getPendingRequestsByGroup
} from "../../service/joinRequests.api";
import { fetchAllPhases } from "../../service/phase.api";
import { fetchGroupEligibilitySummary } from "../../service/eligibility.api";
import MyGroupEligibilitySection from "../components/myGroup/MyGroupEligibilitySection";
import MyGroupHero from "../components/myGroup/MyGroupHero";
import MyGroupMembersSection from "../components/myGroup/MyGroupMembersSection";
import MyGroupRequestsSection from "../components/myGroup/MyGroupRequestsSection";
import MyGroupTabs from "../components/myGroup/MyGroupTabs";
import { getMissingLeadershipRoles } from "../../shared/components/LeadershipGapChips";

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
  const [eligibility, setEligibility] = useState([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityErr, setEligibilityErr] = useState("");

  const isCaptain = String(data?.role || "").toUpperCase() === "CAPTAIN";
  const missingLeadershipRoles = useMemo(
    () => getMissingLeadershipRoles(members),
    [members]
  );

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
        setEligibility([]);
        setEligibilityErr("");
        return;
      }

      const [memberData, pendingData] = await Promise.all([
        fetchGroupMembers(myGroup.group_id),
        String(myGroup.role || "").toUpperCase() === "CAPTAIN"
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
      const phases = await fetchAllPhases();
      const completedPhases = Array.isArray(phases)
        ? phases
            .filter((phase) => String(phase?.status || "").toUpperCase() === "COMPLETED")
            .slice(0, 10)
        : [];

      if (completedPhases.length === 0) {
        setEligibility([]);
        return;
      }

      const rows = await Promise.all(
        completedPhases.map(async (phase) => {
          const baseRow = {
            ...phase,
            phase_id: phase?.phase_id || null,
            phase_name: phase?.phase_name || null,
            phase_status: phase?.status || null,
            earned_points: 0,
            target_points: null,
            is_eligible: null,
            eligibility_error: ""
          };

          try {
            const summary = await fetchGroupEligibilitySummary(phase.phase_id, data.group_id);
            return {
              ...baseRow,
              ...summary
            };
          } catch (err) {
            return {
              ...baseRow,
              eligibility_error:
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Eligibility unavailable for this phase."
            };
          }
        })
      );

      setEligibility(rows);
    } catch (err) {
      setEligibilityErr(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load eligibility."
      );
      setEligibility([]);
    } finally {
      setEligibilityLoading(false);
    }
  }, [data?.group_id]);

  useEffect(() => {
    if (activeTab !== "eligibility" || !data?.group_id) return;
    loadEligibility();
  }, [activeTab, data?.group_id, loadEligibility]);

  useEffect(() => {
    if (!isCaptain && activeTab === "requests") {
      setActiveTab("members");
    }
  }, [activeTab, isCaptain]);

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

  const tabs = useMemo(
    () => [
      { key: "members", label: "Members", count: members.length },
      { key: "eligibility", label: "Eligibility", count: null },
      ...(isCaptain ? [{ key: "requests", label: "Join Requests", count: pending.length }] : [])
    ],
    [isCaptain, members.length, pending.length]
  );

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
          Loading my group...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">My Group</h1>
          <p className="mt-2 text-slate-600">You are not part of any group yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl space-y-4 p-4 md:p-6">
      <MyGroupHero
        actionsDisabled={busy || decisionBusyId !== null}
        data={data}
        loading={loading}
        memberCount={Number(data.member_count || members.length || 0)}
        missingLeadershipRoles={missingLeadershipRoles}
        onLeave={onLeave}
        onRefresh={load}
      />

      {actionErr ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {actionErr}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
          <MyGroupTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />
        </div>

        <div className="p-4 md:p-6">
          {activeTab === "members" ? (
            <MyGroupMembersSection
              currentStudentId={data?.student_id}
              isCaptain={isCaptain}
              members={members}
              onChanged={load}
            />
          ) : activeTab === "eligibility" ? (
            <MyGroupEligibilitySection
              eligibility={eligibility}
              eligibilityErr={eligibilityErr}
              eligibilityLoading={eligibilityLoading}
              onRefresh={loadEligibility}
            />
          ) : (
            <MyGroupRequestsSection
              busy={busy}
              decisionBusyId={decisionBusyId}
              loading={loading}
              onDecision={onDecision}
              onRefresh={load}
              pending={pending}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyGroup;
