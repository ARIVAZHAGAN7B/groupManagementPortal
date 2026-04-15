import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import {
  getMyEventTeamInvitations,
  respondToEventTeamInvitation
} from "../../service/eventTeamInvitations.api";
import {
  decideEventJoinRequest,
  getMyEventJoinRequests,
  getPendingEventJoinRequestsByTeam
} from "../../service/eventJoinRequests.api";
import { fetchGroups } from "../../service/groups.api";
import {
  decideJoinRequest,
  getMyJoinRequests,
  getPendingRequestsByGroup
} from "../../service/joinRequests.api";
import { getMyGroupTierChangeRequests } from "../../service/groupTierRequests.api";
import { getMyLeadershipRoleRequests } from "../../service/leadershipRequests.api";
import {
  fetchMyEventGroupMemberships,
  fetchMyTeamMemberships
} from "../../service/teams.api";
import { fetchMyHubMemberships } from "../../service/hubs.api";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadStudentMembership } from "../../store/slices/studentMembershipSlice";
import { useAuth } from "../../utils/AuthContext";
import RequestCenterEventInbox from "../components/requests/RequestCenterEventInbox";
import RequestCenterEventInvites from "../components/requests/RequestCenterEventInvites";
import RequestCenterGroupInbox from "../components/requests/RequestCenterGroupInbox";
import RequestCenterMyRequests from "../components/requests/RequestCenterMyRequests";
import {
  buildMyRequestRows,
  getErrorMessage,
  isAccessDenied,
  REQUEST_TYPE_META,
  safeArray,
  safeMemberships
} from "../components/requests/requestCenter.utils";
import TeamPageHero from "../components/teams/TeamPageHero";
import { formatLabel, normalizeValue } from "../components/teams/teamPage.utils";
import { WorkspaceFilterBar } from "../../shared/components/WorkspaceInlineFilters";

export default function TeamRequestsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const currentGroup = useAppSelector((state) => state.studentMembership.group);
  const isGroupCaptain = normalizeValue(currentGroup?.role) === "CAPTAIN";
  const currentGroupLabel = currentGroup?.group_name || currentGroup?.group_code || "Your group";

  const [activeTab, setActiveTab] = useState("my");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupInboxError, setGroupInboxError] = useState("");
  const [eventInboxError, setEventInboxError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [loadingGroupInbox, setLoadingGroupInbox] = useState(false);
  const [loadingEventInbox, setLoadingEventInbox] = useState(false);
  const [groupDecisionBusyId, setGroupDecisionBusyId] = useState(null);
  const [eventDecisionBusyId, setEventDecisionBusyId] = useState(null);
  const [inviteDecisionBusyId, setInviteDecisionBusyId] = useState(null);
  const [groupDirectory, setGroupDirectory] = useState([]);
  const [myGroupRequests, setMyGroupRequests] = useState([]);
  const [myEventRequests, setMyEventRequests] = useState([]);
  const [myEventTeamInvites, setMyEventTeamInvites] = useState([]);
  const [myLeadershipRequests, setMyLeadershipRequests] = useState([]);
  const [myGroupTierRequests, setMyGroupTierRequests] = useState([]);
  const [groupPendingRows, setGroupPendingRows] = useState([]);
  const [eventPendingRows, setEventPendingRows] = useState([]);
  const [captainTeams, setCaptainTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [approvalRoleByRequestId, setApprovalRoleByRequestId] = useState({});
  const [teamMembershipCount, setTeamMembershipCount] = useState(0);
  const [hubMembershipCount, setHubMembershipCount] = useState(0);
  const [myQuery, setMyQuery] = useState("");
  const [myTypeFilter, setMyTypeFilter] = useState("ALL");
  const [myStatusFilter, setMyStatusFilter] = useState("ALL");
  const [groupQuery, setGroupQuery] = useState("");
  const [eventQuery, setEventQuery] = useState("");
  const [inviteQuery, setInviteQuery] = useState("");

  useEffect(() => {
    if (!user?.userId) return;
    void dispatch(loadStudentMembership({ userId: user.userId }));
  }, [dispatch, user?.userId]);

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [
        groupRows,
        eventRows,
        inviteRows,
        leadershipRows,
        tierRows,
        groups,
        eventMemberships,
        teamMemberships,
        hubMemberships
      ] = await Promise.all([
        getMyJoinRequests(),
        getMyEventJoinRequests(),
        getMyEventTeamInvitations().catch(() => []),
        getMyLeadershipRoleRequests().catch(() => []),
        getMyGroupTierChangeRequests().catch((requestError) =>
          isAccessDenied(requestError) ? [] : Promise.reject(requestError)
        ),
        fetchGroups().catch(() => []),
        safeMemberships(() => fetchMyEventGroupMemberships({ status: "ACTIVE" })),
        safeMemberships(() => fetchMyTeamMemberships({ status: "ACTIVE", team_type: "TEAM" })),
        safeMemberships(() => fetchMyHubMemberships({ status: "ACTIVE" }))
      ]);
      setMyGroupRequests(safeArray(groupRows));
      setMyEventRequests(safeArray(eventRows));
      setMyEventTeamInvites(safeArray(inviteRows));
      setMyLeadershipRequests(safeArray(leadershipRows));
      setMyGroupTierRequests(safeArray(tierRows));
      setGroupDirectory(safeArray(groups));
      setTeamMembershipCount(teamMemberships.length);
      setHubMembershipCount(hubMemberships.length);
      const captainMemberships = safeArray(eventMemberships).filter(
        (row) => normalizeValue(row?.role) === "CAPTAIN"
      );
      setCaptainTeams(captainMemberships);
      setSelectedTeamId((previousValue) =>
        previousValue &&
        captainMemberships.some((row) => String(row.team_id) === String(previousValue))
          ? previousValue
          : captainMemberships[0]
            ? String(captainMemberships[0].team_id)
            : ""
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load request center."));
      setMyGroupRequests([]);
      setMyEventRequests([]);
      setMyEventTeamInvites([]);
      setMyLeadershipRequests([]);
      setMyGroupTierRequests([]);
      setGroupDirectory([]);
      setCaptainTeams([]);
      setSelectedTeamId("");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGroupInbox = useCallback(async () => {
    if (!currentGroup?.group_id || !isGroupCaptain) {
      setGroupPendingRows([]);
      setGroupInboxError("");
      return;
    }
    setLoadingGroupInbox(true);
    setGroupInboxError("");
    try {
      setGroupPendingRows(safeArray(await getPendingRequestsByGroup(currentGroup.group_id)));
    } catch (requestError) {
      setGroupInboxError(getErrorMessage(requestError, "Failed to load group requests."));
      setGroupPendingRows([]);
    } finally {
      setLoadingGroupInbox(false);
    }
  }, [currentGroup?.group_id, isGroupCaptain]);

  const loadEventInbox = useCallback(async (teamId) => {
    if (!teamId) {
      setEventPendingRows([]);
      setEventInboxError("");
      return;
    }
    setLoadingEventInbox(true);
    setEventInboxError("");
    try {
      const rows = safeArray(await getPendingEventJoinRequestsByTeam(teamId));
      setEventPendingRows(rows);
      setApprovalRoleByRequestId((previousValue) =>
        rows.reduce(
          (nextValue, row) => ({
            ...nextValue,
            [row.event_request_id]: nextValue[row.event_request_id] || "MEMBER"
          }),
          { ...previousValue }
        )
      );
    } catch (requestError) {
      setEventInboxError(getErrorMessage(requestError, "Failed to load event-group requests."));
      setEventPendingRows([]);
    } finally {
      setLoadingEventInbox(false);
    }
  }, []);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);
  useEffect(() => {
    void loadGroupInbox();
  }, [loadGroupInbox]);
  useEffect(() => {
    if (activeTab === "event" && selectedTeamId) void loadEventInbox(selectedTeamId);
  }, [activeTab, loadEventInbox, selectedTeamId]);

  const refreshAll = useCallback(() => {
    void loadBase();
    void loadGroupInbox();
    if (selectedTeamId) void loadEventInbox(selectedTeamId);
    if (user?.userId) void dispatch(loadStudentMembership({ force: true, userId: user.userId }));
  }, [dispatch, loadBase, loadEventInbox, loadGroupInbox, selectedTeamId, user?.userId]);

  const handleRealtimeRefresh = useDebouncedCallback(() => {
    refreshAll();
  }, 300);

  useRealtimeEvents(
    [
      REALTIME_EVENTS.JOIN_REQUESTS,
      REALTIME_EVENTS.EVENT_JOIN_REQUESTS,
      REALTIME_EVENTS.EVENT_TEAM_INVITATIONS,
      REALTIME_EVENTS.LEADERSHIP_REQUESTS,
      REALTIME_EVENTS.GROUP_TIER_REQUESTS,
      REALTIME_EVENTS.MEMBERSHIPS,
      REALTIME_EVENTS.TEAM_MEMBERSHIPS
    ],
    handleRealtimeRefresh
  );

  const groupMap = useMemo(
    () =>
      new Map(safeArray(groupDirectory).map((group) => [String(group.group_id), group])),
    [groupDirectory]
  );
  const allMyRequests = useMemo(
    () =>
      buildMyRequestRows({
        eventJoinRequests: myEventRequests,
        formatLabel,
        groupJoinRequests: myGroupRequests,
        groupMap,
        groupTierRequests: myGroupTierRequests,
        leadershipRequests: myLeadershipRequests,
        normalizeValue
      }),
    [groupMap, myEventRequests, myGroupRequests, myGroupTierRequests, myLeadershipRequests]
  );
  const myTypeOptions = useMemo(
    () => ["ALL", ...new Set(allMyRequests.map((row) => row.typeKey).filter(Boolean))],
    [allMyRequests]
  );
  const myStatusOptions = useMemo(
    () => ["ALL", ...new Set(allMyRequests.map((row) => row.status).filter(Boolean))],
    [allMyRequests]
  );
  const filteredMyRequests = useMemo(
    () =>
      allMyRequests.filter(
        (row) =>
          (!String(myQuery || "").trim() ||
            row.searchText.includes(String(myQuery).trim().toLowerCase())) &&
          (myTypeFilter === "ALL" || row.typeKey === myTypeFilter) &&
          (myStatusFilter === "ALL" || row.status === myStatusFilter)
      ),
    [allMyRequests, myQuery, myStatusFilter, myTypeFilter]
  );
  const filteredGroupPendingRows = useMemo(
    () =>
      groupPendingRows.filter(
        (row) =>
          !String(groupQuery || "").trim() ||
          [row.student_id, row.status, row.request_id]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(String(groupQuery).trim().toLowerCase())
      ),
    [groupPendingRows, groupQuery]
  );
  const filteredEventPendingRows = useMemo(
    () =>
      eventPendingRows.filter(
        (row) =>
          !String(eventQuery || "").trim() ||
          [row.student_name, row.student_email, row.student_id, row.department, row.year]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(String(eventQuery).trim().toLowerCase())
      ),
    [eventPendingRows, eventQuery]
  );
  const filteredInviteRows = useMemo(
    () =>
      myEventTeamInvites.filter(
        (row) =>
          !String(inviteQuery || "").trim() ||
          [
            row.team_name,
            row.team_code,
            row.event_name,
            row.event_code,
            row.inviter_name,
            row.inviter_email,
            row.status
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(String(inviteQuery).trim().toLowerCase())
      ),
    [inviteQuery, myEventTeamInvites]
  );
  const selectedCaptainTeam = useMemo(
    () => captainTeams.find((row) => String(row.team_id) === String(selectedTeamId)) || null,
    [captainTeams, selectedTeamId]
  );
  const pendingMyRequestsCount = useMemo(
    () => allMyRequests.filter((row) => row.status === "PENDING").length,
    [allMyRequests]
  );
  const pendingInviteCount = useMemo(
    () =>
      myEventTeamInvites.filter(
        (row) => String(row.status || "").toUpperCase() === "PENDING"
      ).length,
    [myEventTeamInvites]
  );

  const requestTabs = useMemo(
    () => [
      { key: "my", label: "My Requests" },
      { key: "invites", label: "Event Team Invites" },
      ...(isGroupCaptain && currentGroup?.group_id ? [{ key: "group", label: "Group Inbox" }] : []),
      ...(captainTeams.length > 0 ? [{ key: "event", label: "Event Group Inboxes" }] : [])
    ],
    [captainTeams.length, currentGroup?.group_id, isGroupCaptain]
  );
  useEffect(() => {
    if (!requestTabs.some((tab) => tab.key === activeTab)) setActiveTab("my");
  }, [activeTab, requestTabs]);

  const canResetFilters =
    activeTab === "my"
      ? Boolean(String(myQuery || "").trim()) ||
        myTypeFilter !== "ALL" ||
        myStatusFilter !== "ALL"
      : activeTab === "invites"
        ? Boolean(String(inviteQuery || "").trim())
      : activeTab === "group"
        ? Boolean(String(groupQuery || "").trim())
        : Boolean(String(eventQuery || "").trim());
  const filterFields = useMemo(() => {
    if (activeTab === "my") {
      return [
        {
          key: "query",
          type: "search",
          label: "Search",
          value: myQuery,
          placeholder: "Search by group, event, type, status, or decision",
          onChangeValue: setMyQuery
        },
        {
          key: "type",
          type: "select",
          label: "Request Type",
          value: myTypeFilter,
          onChangeValue: setMyTypeFilter,
          wrapperClassName: "w-full sm:w-[220px]",
          options: [
            { value: "ALL", label: "All request types" },
            ...myTypeOptions
              .filter((option) => option !== "ALL")
              .map((option) => ({
                value: option,
                label: REQUEST_TYPE_META[option]?.label || option
              }))
          ]
        },
        {
          key: "status",
          type: "select",
          label: "Status",
          value: myStatusFilter,
          onChangeValue: setMyStatusFilter,
          wrapperClassName: "w-full sm:w-[180px]",
          options: [
            { value: "ALL", label: "All statuses" },
            ...myStatusOptions
              .filter((option) => option !== "ALL")
              .map((option) => ({
                value: option,
                label: formatLabel(option)
              }))
          ]
        }
      ];
    }

    if (activeTab === "invites") {
      return [
        {
          key: "query",
          type: "search",
          label: "Search",
          value: inviteQuery,
          placeholder: "Search by team, event, inviter, or status",
          onChangeValue: setInviteQuery
        }
      ];
    }

    if (activeTab === "group") {
      return [
        {
          key: "query",
          type: "search",
          label: "Search",
          value: groupQuery,
          placeholder: "Search by student id or request id",
          onChangeValue: setGroupQuery
        }
      ];
    }

    return [
      {
        key: "query",
        type: "search",
        label: "Search",
        value: eventQuery,
        placeholder: "Search by student, email, department, or year",
        onChangeValue: setEventQuery
      }
    ];
  }, [
    activeTab,
    eventQuery,
    groupQuery,
    inviteQuery,
    myQuery,
    myStatusFilter,
    myStatusOptions,
    myTypeFilter,
    myTypeOptions
  ]);

  const resetFilters = () =>
    activeTab === "my"
      ? (setMyQuery(""), setMyTypeFilter("ALL"), setMyStatusFilter("ALL"))
      : activeTab === "invites"
        ? setInviteQuery("")
        : activeTab === "group"
          ? setGroupQuery("")
          : setEventQuery("");

  const onGroupDecision = async (requestId, status) => {
    setGroupDecisionBusyId(requestId);
    setGroupInboxError("");
    try {
      await decideJoinRequest(
        requestId,
        status,
        status === "APPROVED"
          ? "Approved by group captain"
          : "Rejected by group captain"
      );
      await Promise.all([loadBase(), loadGroupInbox()]);
    } catch (requestError) {
      setGroupInboxError(getErrorMessage(requestError, "Failed to update group request."));
    } finally {
      setGroupDecisionBusyId(null);
    }
  };

  const onEventDecision = async (requestId, status) => {
    setEventDecisionBusyId(requestId);
    setEventInboxError("");
    try {
      await decideEventJoinRequest(
        requestId,
        status,
        status === "APPROVED"
          ? "Approved by event group captain"
          : "Rejected by event group captain",
        status === "APPROVED" ? approvalRoleByRequestId[requestId] || "MEMBER" : undefined
      );
      await Promise.all([loadBase(), loadEventInbox(selectedTeamId)]);
    } catch (requestError) {
      setEventInboxError(
        getErrorMessage(requestError, "Failed to update event-group request.")
      );
    } finally {
      setEventDecisionBusyId(null);
    }
  };

  const onInviteDecision = async (invitationId, status) => {
    setInviteDecisionBusyId(invitationId);
    setInviteError("");
    try {
      await respondToEventTeamInvitation(invitationId, {
        status,
        response_note:
          status === "ACCEPTED"
            ? "Accepted event team invitation"
            : "Rejected event team invitation"
      });
      await loadBase();
    } catch (requestError) {
      setInviteError(getErrorMessage(requestError, "Failed to update event team invite."));
    } finally {
      setInviteDecisionBusyId(null);
    }
  };

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <TeamPageHero
        loading={loading}
        onRefresh={refreshAll}
        eyebrow="Request Center"
        title="All Requests"
        summary={
          activeTab === "my"
            ? `${filteredMyRequests.length} of ${allMyRequests.length} request records shown`
            : activeTab === "invites"
              ? `${filteredInviteRows.length} of ${myEventTeamInvites.length} invite record${myEventTeamInvites.length === 1 ? "" : "s"} shown`
              : activeTab === "group"
                ? `${filteredGroupPendingRows.length} pending group request${filteredGroupPendingRows.length === 1 ? "" : "s"} for ${currentGroupLabel}`
                : selectedCaptainTeam
                  ? `${filteredEventPendingRows.length} inbox item${filteredEventPendingRows.length === 1 ? "" : "s"} for ${selectedCaptainTeam.team_name}`
                  : `${captainTeams.length} event-group captain inbox${captainTeams.length === 1 ? "" : "es"} available`
        }
        actionLabel="Refresh requests"
        actionBusyLabel="Refreshing..."
        stats={[
          {
            accentClass: "bg-[#1754cf]",
            detail: "All request records tied to your student account",
            label: "My Requests",
            value: allMyRequests.length
          },
          {
            accentClass: "bg-amber-500",
            detail: "Requests still waiting on a decision",
            label: "Pending My Requests",
            value: pendingMyRequestsCount
          },
          {
            accentClass: "bg-fuchsia-500",
            detail: "Teammate invites waiting for your response",
            label: "Event Team Invites",
            value: pendingInviteCount
          },
          {
            accentClass: "bg-emerald-500",
            detail: isGroupCaptain
              ? `Pending join requests for ${currentGroupLabel}`
              : "Captain your group to review group join requests",
            label: "Group Inbox",
            value: isGroupCaptain ? groupPendingRows.length : "-"
          },
          {
            accentClass: "bg-sky-500",
            detail:
              captainTeams.length > 0
                ? `${captainTeams.length} event-group captain inbox${captainTeams.length === 1 ? "" : "es"} available`
                : "No event-group captain inboxes yet",
            label: "Event Inboxes",
            value: captainTeams.length
          },
          {
            accentClass: "bg-slate-400",
            detail: `${teamMembershipCount} team${teamMembershipCount === 1 ? "" : "s"} and ${hubMembershipCount} hub${hubMembershipCount === 1 ? "" : "s"} currently use direct join`,
            label: "Teams & Hubs",
            value: teamMembershipCount + hubMembershipCount
          }
        ]}
      />
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
        Regular teams and hubs currently use direct join, while this page manages request-based flows:
        group joins, leadership, group tier changes, event-group joins, and teammate event invites.
      </div>
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {requestTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.key
                  ? "border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>
      <div className="lg:hidden">
        <WorkspaceFilterBar
          fields={filterFields}
          onReset={resetFilters}
          hasActiveFilters={canResetFilters}
        />
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {activeTab === "my" ? (
          <RequestCenterMyRequests
            canReset={canResetFilters}
            loading={loading}
            myQuery={myQuery}
            myStatusFilter={myStatusFilter}
            myStatusOptions={myStatusOptions}
            myTypeFilter={myTypeFilter}
            myTypeOptions={myTypeOptions}
            onReset={resetFilters}
            rows={filteredMyRequests}
            setMyQuery={setMyQuery}
            setMyStatusFilter={setMyStatusFilter}
            setMyTypeFilter={setMyTypeFilter}
          />
        ) : activeTab === "invites" ? (
          <RequestCenterEventInvites
            canReset={canResetFilters}
            decisionBusyId={inviteDecisionBusyId}
            error={inviteError}
            loading={loading}
            onDecision={onInviteDecision}
            onReset={resetFilters}
            query={inviteQuery}
            rows={filteredInviteRows}
            setQuery={setInviteQuery}
          />
        ) : activeTab === "group" ? (
          <RequestCenterGroupInbox
            canReset={canResetFilters}
            currentGroupLabel={currentGroupLabel}
            decisionBusyId={groupDecisionBusyId}
            error={groupInboxError}
            isGroupCaptain={isGroupCaptain}
            loading={loadingGroupInbox}
            onDecision={onGroupDecision}
            onReset={resetFilters}
            query={groupQuery}
            rows={filteredGroupPendingRows}
            setQuery={setGroupQuery}
          />
        ) : (
          <RequestCenterEventInbox
            approvalRoleByRequestId={approvalRoleByRequestId}
            canReset={canResetFilters}
            captainTeams={captainTeams}
            decisionBusyId={eventDecisionBusyId}
            error={eventInboxError}
            filteredRows={filteredEventPendingRows}
            loading={loadingEventInbox}
            onChangeApprovalRole={(requestId, role) =>
              setApprovalRoleByRequestId((previousValue) => ({
                ...previousValue,
                [requestId]: role
              }))
            }
            onDecision={onEventDecision}
            onLoadInbox={loadEventInbox}
            onReset={resetFilters}
            query={eventQuery}
            rows={filteredEventPendingRows}
            selectedCaptainTeam={selectedCaptainTeam}
            selectedTeamId={selectedTeamId}
            setQuery={setEventQuery}
            setSelectedTeamId={setSelectedTeamId}
          />
        )}
      </section>
    </div>
  );
}
