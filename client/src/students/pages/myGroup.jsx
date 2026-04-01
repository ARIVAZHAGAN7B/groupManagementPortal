import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import GroupOffRoundedIcon from "@mui/icons-material/GroupOffRounded";
import { useAdaptiveNow } from "../../hooks/useAdaptiveNow";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadStudentMembership } from "../../store/slices/studentMembershipSlice";
import { useAuth } from "../../utils/AuthContext";
import {
  fetchGroupMembers,
  fetchGroupRankHistory,
  fetchGroupRankRules,
  leaveGroup,
  updateGroupRankRules
} from "../../service/membership.api";
import {
  decideJoinRequest,
  getPendingRequestsByGroup
} from "../../service/joinRequests.api";
import {
  applyLeadershipRoleRequest,
  getMyLeadershipRoleRequests
} from "../../service/leadershipRequests.api";
import { fetchAllPhases } from "../../service/phase.api";
import { fetchGroupEligibilitySummary } from "../../service/eligibility.api";
import MyGroupHero from "../components/myGroup/MyGroupHero";
import MyGroupTabs from "../components/myGroup/MyGroupTabs";
import { getMissingLeadershipRoles } from "../../shared/components/LeadershipGapChips";

const MyGroupEligibilitySection = lazy(() =>
  import("../components/myGroup/MyGroupEligibilitySection")
);
const MyGroupLeadershipSection = lazy(() =>
  import("../components/myGroup/MyGroupLeadershipSection")
);
const MyGroupMembersSection = lazy(() =>
  import("../components/myGroup/MyGroupMembersSection")
);
const MyGroupRankSection = lazy(() => import("../components/myGroup/MyGroupRankSection"));
const MyGroupRequestsSection = lazy(() => import("../components/myGroup/MyGroupRequestsSection"));

const formatCountdown = (ms) => {
  if (!Number.isFinite(ms)) return "Unavailable";
  if (ms <= 0) return "Expired";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const formatRuleLabel = (rule) => {
  if (!rule) return "Rejoin rule";
  if (rule === "NEXT_WORKING_DAY_END") return "Next working day end";

  return String(rule)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const EmptyMyGroupState = ({ deadlineInfo, nowMs }) => {
  const deadline = deadlineInfo?.rejoin_deadline_at
    ? new Date(deadlineInfo.rejoin_deadline_at)
    : null;
  const hasValidDeadline = deadline instanceof Date && !Number.isNaN(deadline.getTime());
  const remainingMs = hasValidDeadline ? deadline.getTime() - nowMs : NaN;
  const expired =
    Boolean(deadlineInfo?.is_expired) || (hasValidDeadline ? remainingMs <= 0 : false);

  return (
    <div className="flex min-h-[calc(100vh-11rem)] items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_-36px_rgba(15,23,42,0.35)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <GroupOffRoundedIcon sx={{ fontSize: 32 }} />
        </div>

        <div className="mt-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            My Group
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">You&apos;re not in a group</h1>
          <p className="mt-2 text-sm text-slate-500">
            Join a group before the deadline to get back into team activities.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
            <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />
            <span>Time remaining to join</span>
          </div>

          {deadlineInfo?.has_rejoin_deadline ? (
            <>
              <div className={`mt-3 text-3xl font-black ${expired ? "text-rose-700" : "text-[#3211d4]"}`}>
                {expired ? "Expired" : formatCountdown(remainingMs)}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {hasValidDeadline
                  ? `Join by ${deadline.toLocaleString()}`
                  : "Join deadline unavailable"}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                    deadlineInfo?.self_join_rule_enforced
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {deadlineInfo?.self_join_rule_enforced ? "Enforced" : "Not Enforced"}
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                  Rule: {formatRuleLabel(deadlineInfo?.rule)}
                </span>
                {expired ? (
                  <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                    Admin approval required
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div className="mt-3 text-3xl font-black text-emerald-700">Open</div>
              <div className="mt-2 text-xs text-slate-500">You can join a group right now.</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionFallback = () => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
    Loading section...
  </div>
);

const MyGroup = () => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const {
    group: data,
    rejoinDeadline,
    status: membershipStatus,
    error: membershipError,
    hasLoaded: membershipHasLoaded
  } = useAppSelector((state) => state.studentMembership);
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [decisionBusyId, setDecisionBusyId] = useState(null);
  const [actionErr, setActionErr] = useState("");
  const [activeTab, setActiveTab] = useState("members");
  const [eligibility, setEligibility] = useState([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityErr, setEligibilityErr] = useState("");
  const [leadershipRequests, setLeadershipRequests] = useState([]);
  const [leadershipLoading, setLeadershipLoading] = useState(false);
  const [leadershipErr, setLeadershipErr] = useState("");
  const [leadershipSubmitting, setLeadershipSubmitting] = useState(false);
  const [rankHistory, setRankHistory] = useState([]);
  const [rankRules, setRankRules] = useState(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankSaving, setRankSaving] = useState(false);
  const [rankErr, setRankErr] = useState("");
  const [leadershipForm, setLeadershipForm] = useState({
    requested_role: "",
    request_reason: ""
  });
  const rejoinTargetTimeMs = useMemo(() => {
    if (data || !rejoinDeadline?.has_rejoin_deadline) return NaN;
    return Date.parse(rejoinDeadline.rejoin_deadline_at);
  }, [data, rejoinDeadline]);
  const nowMs = useAdaptiveNow(rejoinTargetTimeMs);

  const currentRole = String(data?.role || "").toUpperCase();
  const isCaptain = currentRole === "CAPTAIN";
  const missingLeadershipRoles = useMemo(
    () => getMissingLeadershipRoles(members),
    [members]
  );
  const canRequestLeadershipRole = currentRole === "MEMBER";
  const activeLeadershipCount = useMemo(
    () =>
      members.filter((member) =>
        ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"].includes(
          String(member?.role || "").toUpperCase()
        )
      ).length,
    [members]
  );
  const canCaptainOverrideRank = isCaptain && activeLeadershipCount > 2;
  const currentGroupLeadershipRequests = useMemo(
    () =>
      leadershipRequests.filter(
        (row) => String(row?.group_id) === String(data?.group_id)
      ),
    [data?.group_id, leadershipRequests]
  );
  const pendingLeadershipRequest = useMemo(
    () =>
      currentGroupLeadershipRequests.find(
        (row) => String(row?.status || "").toUpperCase() === "PENDING"
      ) || null,
    [currentGroupLeadershipRequests]
  );
  const loading = !membershipHasLoaded || membershipStatus === "loading" || detailsLoading;
  const pageError = membershipError || error;

  const load = useCallback(async () => {
    if (!user?.userId) return;

    await dispatch(
      loadStudentMembership({
        force: true,
        userId: user.userId
      })
    );
  }, [dispatch, user?.userId]);

  const loadGroupDetails = useCallback(async () => {
    if (!data?.group_id) {
      setMembers([]);
      setPending([]);
      setError("");
      return;
    }

    setDetailsLoading(true);
    setError("");

    try {
      const [memberData, pendingData] = await Promise.all([
        fetchGroupMembers(data.group_id),
        String(data.role || "").toUpperCase() === "CAPTAIN"
          ? getPendingRequestsByGroup(data.group_id)
          : Promise.resolve([])
      ]);

      setMembers(Array.isArray(memberData) ? memberData : []);
      setPending(Array.isArray(pendingData) ? pendingData : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load group details.");
      setMembers([]);
      setPending([]);
    } finally {
      setDetailsLoading(false);
    }
  }, [data?.group_id, data?.role]);

  useEffect(() => {
    if (!user?.userId) return;
    dispatch(loadStudentMembership({ userId: user.userId }));
  }, [dispatch, user?.userId]);

  useEffect(() => {
    if (!membershipHasLoaded) return;

    if (!data?.group_id) {
      setMembers([]);
      setPending([]);
      setEligibility([]);
      setEligibilityErr("");
      setLeadershipRequests([]);
      setLeadershipErr("");
      setRankHistory([]);
      setRankRules(null);
      setRankErr("");
      return;
    }

    void loadGroupDetails();
  }, [data?.group_id, loadGroupDetails, membershipHasLoaded]);

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
            eligibility_multiplier: null,
            eligibility_awarded_points: 0,
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

  const loadRankData = useCallback(async () => {
    if (!data?.group_id) {
      setRankHistory([]);
      setRankRules(null);
      setRankErr("");
      return;
    }

    setRankLoading(true);
    setRankErr("");

    try {
      const [historyRows, rulesData] = await Promise.all([
        fetchGroupRankHistory(data.group_id),
        fetchGroupRankRules(data.group_id)
      ]);

      setRankHistory(Array.isArray(historyRows) ? historyRows : []);
      setRankRules(rulesData || null);
    } catch (err) {
      setRankErr(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load rank overview."
      );
      setRankHistory([]);
      setRankRules(null);
    } finally {
      setRankLoading(false);
    }
  }, [data?.group_id]);

  const loadLeadershipRequests = useCallback(async () => {
    if (!data?.group_id) {
      setLeadershipRequests([]);
      setLeadershipErr("");
      return;
    }

    setLeadershipLoading(true);
    setLeadershipErr("");

    try {
      const rows = await getMyLeadershipRoleRequests();
      const nextRows = Array.isArray(rows)
        ? rows.filter((row) => String(row?.group_id) === String(data.group_id))
        : [];

      setLeadershipRequests(nextRows);
    } catch (err) {
      setLeadershipErr(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load leadership requests."
      );
      setLeadershipRequests([]);
    } finally {
      setLeadershipLoading(false);
    }
  }, [data?.group_id]);

  const handleRealtimeRefresh = useDebouncedCallback(() => {
    void load();
    void loadGroupDetails();

    if (activeTab === "eligibility") {
      void loadEligibility();
    }
    if (activeTab === "leadership") {
      void loadLeadershipRequests();
    }
    if (activeTab === "rank") {
      void loadRankData();
    }
  }, 300);

  useRealtimeEvents(
    [
      REALTIME_EVENTS.JOIN_REQUESTS,
      REALTIME_EVENTS.LEADERSHIP_REQUESTS,
      REALTIME_EVENTS.MEMBERSHIPS,
      REALTIME_EVENTS.POINTS,
      REALTIME_EVENTS.ELIGIBILITY
    ],
    handleRealtimeRefresh
  );

  useEffect(() => {
    if (activeTab !== "eligibility" || !data?.group_id) return;
    loadEligibility();
  }, [activeTab, data?.group_id, loadEligibility]);

  useEffect(() => {
    if (activeTab !== "leadership" || !data?.group_id) return;
    loadLeadershipRequests();
  }, [activeTab, data?.group_id, loadLeadershipRequests]);

  useEffect(() => {
    if (activeTab !== "rank" || !data?.group_id) return;
    loadRankData();
  }, [activeTab, data?.group_id, loadRankData]);

  useEffect(() => {
    if (!isCaptain && activeTab === "requests") {
      setActiveTab("members");
    }
  }, [activeTab, isCaptain]);

  useEffect(() => {
    if (!canRequestLeadershipRole && currentGroupLeadershipRequests.length === 0 && activeTab === "leadership") {
      setActiveTab("members");
    }
  }, [activeTab, canRequestLeadershipRole, currentGroupLeadershipRequests.length]);

  useEffect(() => {
    setLeadershipForm((prev) => {
      if (
        prev.requested_role &&
        missingLeadershipRoles.includes(String(prev.requested_role).toUpperCase())
      ) {
        return prev;
      }

      return {
        ...prev,
        requested_role: missingLeadershipRoles[0] || ""
      };
    });
  }, [missingLeadershipRoles]);

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
      await Promise.all([load(), loadGroupDetails()]);
    } catch (err) {
      setActionErr(err?.response?.data?.message || "Failed to update request.");
    } finally {
      setDecisionBusyId(null);
    }
  };

  const updateLeadershipForm = (field, value) => {
    setLeadershipForm((prev) => ({
      ...prev,
      [field]: value
    }));
    setLeadershipErr("");
    setActionErr("");
  };

  const onLeadershipSubmit = async (event) => {
    event.preventDefault();

    if (!data?.group_id || !canRequestLeadershipRole) return;

    const requestedRole = String(leadershipForm.requested_role || "")
      .trim()
      .toUpperCase();

    if (!requestedRole) {
      setLeadershipErr("Select an open leadership role.");
      return;
    }

    setLeadershipSubmitting(true);
    setLeadershipErr("");
    setActionErr("");

    try {
      await applyLeadershipRoleRequest({
        group_id: data.group_id,
        requested_role: requestedRole,
        request_reason: String(leadershipForm.request_reason || "").trim()
      });

      setLeadershipForm({
        requested_role: missingLeadershipRoles[0] || "",
        request_reason: ""
      });

      await Promise.all([loadLeadershipRequests(), load()]);
      setActiveTab("leadership");
    } catch (err) {
      setLeadershipErr(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to submit leadership request."
      );
    } finally {
      setLeadershipSubmitting(false);
    }
  };

  const onSaveRankRules = async (payload) => {
    if (!data?.group_id || !isCaptain) return;

    setRankSaving(true);
    setRankErr("");
    setActionErr("");

    try {
      const result = await updateGroupRankRules(data.group_id, payload);
      setRankRules(result || null);
      await load();
      await loadRankData();
      setActiveTab("rank");
    } catch (err) {
      setRankErr(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to save rank criteria."
      );
    } finally {
      setRankSaving(false);
    }
  };

  const refreshPage = useCallback(() => {
    void load();
    void loadGroupDetails();

    if (activeTab === "eligibility") {
      void loadEligibility();
    }
    if (activeTab === "leadership") {
      void loadLeadershipRequests();
    }
    if (activeTab === "rank") {
      void loadRankData();
    }
  }, [activeTab, load, loadEligibility, loadGroupDetails, loadLeadershipRequests, loadRankData]);

  const tabs = useMemo(
    () => [
      { key: "members", label: "Members", count: members.length },
      { key: "rank", label: "Rank", count: null },
      { key: "eligibility", label: "Eligibility", count: null },
      ...(canRequestLeadershipRole || currentGroupLeadershipRequests.length > 0
        ? [
            {
              key: "leadership",
              label: "Leadership",
              count: currentGroupLeadershipRequests.filter(
                (row) => String(row?.status || "").toUpperCase() === "PENDING"
              ).length
            }
          ]
        : []),
      ...(isCaptain ? [{ key: "requests", label: "Join Requests", count: pending.length }] : [])
    ],
    [
      canRequestLeadershipRole,
      currentGroupLeadershipRequests,
      isCaptain,
      members.length,
      pending.length
    ]
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

  if (pageError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          {pageError}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyMyGroupState deadlineInfo={rejoinDeadline} nowMs={nowMs} />
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
        onRefresh={refreshPage}
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
          <Suspense fallback={<SectionFallback />}>
            {activeTab === "members" ? (
              <MyGroupMembersSection
                currentStudentId={data?.student_id}
                isCaptain={isCaptain}
                canEditRank={canCaptainOverrideRank}
                members={members}
                onChanged={load}
                showRankCriteria={false}
                compactRank={true}
              />
            ) : activeTab === "rank" ? (
              <MyGroupRankSection
                currentStudentId={data?.student_id}
                isCaptain={isCaptain}
                canOverrideRank={canCaptainOverrideRank}
                members={members}
                rankHistory={rankHistory}
                rankRules={rankRules}
                loading={rankLoading}
                saving={rankSaving}
                error={rankErr}
                onRefresh={loadRankData}
                onSaveRules={onSaveRankRules}
              />
            ) : activeTab === "eligibility" ? (
              <MyGroupEligibilitySection
                eligibility={eligibility}
                eligibilityErr={eligibilityErr}
                eligibilityLoading={eligibilityLoading}
                onRefresh={loadEligibility}
              />
            ) : activeTab === "leadership" ? (
              <MyGroupLeadershipSection
                canRequest={canRequestLeadershipRole}
                currentRole={currentRole}
                form={leadershipForm}
                loading={leadershipLoading}
                missingRoles={missingLeadershipRoles}
                onRefresh={loadLeadershipRequests}
                onSubmit={onLeadershipSubmit}
                onUpdateForm={updateLeadershipForm}
                pendingRequest={pendingLeadershipRequest}
                requests={currentGroupLeadershipRequests}
                submitError={leadershipErr}
                submitting={leadershipSubmitting}
              />
            ) : (
              <MyGroupRequestsSection
                busy={busy}
                decisionBusyId={decisionBusyId}
                loading={loading}
                onDecision={onDecision}
                onRefresh={refreshPage}
                pending={pending}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default MyGroup;
