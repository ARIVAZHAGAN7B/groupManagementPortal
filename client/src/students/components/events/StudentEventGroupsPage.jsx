import { useCallback, useEffect, useMemo, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useNavigate, useParams } from "react-router-dom";
import { useRealtimeEvents } from "../../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../../lib/realtime";
import { fetchEventById } from "../../../service/events.api";
import { getMyEventJoinRequests } from "../../../service/eventJoinRequests.api";
import {
  createEventGroup,
  fetchEventGroupsByEvent,
  fetchMyEventGroupMemberships,
  registerIndividualEvent,
  searchEventRegistrationCandidates
} from "../../../service/teams.api";
import { fetchMyHubMemberships } from "../../../service/hubs.api";
import {
  TeamDesktopTableShell
} from "../teams/TeamDesktopTableControls";
import { formatLabel, normalizeValue } from "../teams/teamPage.utils";
import { WorkspaceFilterBar } from "../../../shared/components/WorkspaceInlineFilters";
import WorkspacePageHeader, {
  WorkspacePageHeaderActionButton
} from "../../../shared/components/WorkspacePageHeader";
import EventGroupCreateModal from "./EventGroupCreateModal";
import EventGroupsMobileCards from "./EventGroupsMobileCards";
import EventGroupsTable from "./EventGroupsTable";
import EventSummaryPanel from "./EventSummaryPanel";
import {
  EMPTY_EVENT_GROUP_FORM,
  EVENT_GROUP_REQUEST_STATE_OPTIONS,
  EVENT_GROUP_STATUS_OPTIONS,
  getEventAllowedHubSummary,
  getEventAllowedHubRows,
  getEventHubRestrictionLabel,
  getEventGroupRequestStatus,
  getEventRegistrationModeLabel,
  getEventRegistrationStatus
} from "./events.constants";

const HUB_RULE_REQUIREMENTS = [
  { key: "PROMINENT", label: "prominent", required: 2 },
  { key: "MEDIUM", label: "medium", required: 2 },
  { key: "LOW", label: "low", required: 2 }
];

export default function StudentEventGroupsPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [rows, setRows] = useState([]);
  const [myActiveMemberships, setMyActiveMemberships] = useState([]);
  const [myHubMemberships, setMyHubMemberships] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState(EMPTY_EVENT_GROUP_FORM);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [inviteSearchRows, setInviteSearchRows] = useState([]);
  const [inviteSearchLoading, setInviteSearchLoading] = useState(false);
  const [selectedInvitees, setSelectedInvitees] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventRow, groupRows, membershipRes, hubMembershipRes, requestRows] = await Promise.all([
        fetchEventById(eventId),
        fetchEventGroupsByEvent(eventId),
        fetchMyEventGroupMemberships({ status: "ACTIVE" }),
        fetchMyHubMemberships({ status: "ACTIVE" }),
        getMyEventJoinRequests()
      ]);

      setEvent(eventRow || null);
      setRows(Array.isArray(groupRows) ? groupRows : []);
      setMyActiveMemberships(
        Array.isArray(membershipRes?.memberships) ? membershipRes.memberships : []
      );
      setMyHubMemberships(
        Array.isArray(hubMembershipRes?.memberships) ? hubMembershipRes.memberships : []
      );
      setMyRequests(Array.isArray(requestRows) ? requestRows : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load event registrations");
      setEvent(null);
      setRows([]);
      setMyActiveMemberships([]);
      setMyHubMemberships([]);
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeEvents(
    [REALTIME_EVENTS.EVENT_JOIN_REQUESTS, REALTIME_EVENTS.TEAM_MEMBERSHIPS],
    () => {
      void load();
    }
  );

  useEffect(() => {
    setTeamForm(EMPTY_EVENT_GROUP_FORM);
    setCreateModalOpen(false);
    setInviteSearchQuery("");
    setInviteSearchRows([]);
    setInviteSearchLoading(false);
    setSelectedInvitees([]);
  }, [eventId]);

  useEffect(() => {
    if (!createModalOpen || !eventId) {
      setInviteSearchRows([]);
      setInviteSearchLoading(false);
      return undefined;
    }

    const normalizedQuery = String(inviteSearchQuery || "").trim();
    if (!normalizedQuery) {
      setInviteSearchRows([]);
      setInviteSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    setInviteSearchLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const rows = await searchEventRegistrationCandidates(eventId, {
          q: normalizedQuery,
          limit: 10
        });
        if (!cancelled) {
          setInviteSearchRows(Array.isArray(rows) ? rows : []);
        }
      } catch (_error) {
        if (!cancelled) {
          setInviteSearchRows([]);
        }
      } finally {
        if (!cancelled) {
          setInviteSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [createModalOpen, eventId, inviteSearchQuery]);

  const myActiveMembershipInEvent = useMemo(
    () =>
      myActiveMemberships.find(
        (membership) => String(membership.event_id || "") === String(eventId)
      ) || null,
    [eventId, myActiveMemberships]
  );

  const myTeamIdSet = useMemo(
    () => new Set(myActiveMemberships.map((membership) => Number(membership.team_id))),
    [myActiveMemberships]
  );

  const latestRequestByTeamId = useMemo(() => {
    const map = new Map();

    for (const row of myRequests) {
      const teamId = Number(row?.team_id);
      if (Number.isFinite(teamId) && !map.has(teamId)) {
        map.set(teamId, row);
      }
    }

    return map;
  }, [myRequests]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return rows.filter((team) => {
      const requestStatus = getEventGroupRequestStatus({
        latestRequestByTeamId,
        myTeamIdSet,
        teamId: team.team_id
      });

      const matchesQuery =
        !normalizedQuery ||
        [team.team_code, team.team_name, team.status, team.description, requestStatus.label]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "ALL" || normalizeValue(team.status) === statusFilter;

      const matchesRequest =
        requestStatusFilter === "ALL" || requestStatus.key === requestStatusFilter;

      return matchesQuery && matchesStatus && matchesRequest;
    });
  }, [latestRequestByTeamId, myTeamIdSet, query, requestStatusFilter, rows, statusFilter]);

  const resetFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("ALL");
    setRequestStatusFilter("ALL");
  }, []);

  const eventActive = normalizeValue(event?.status) === "ACTIVE";
  const individualRegistration =
    String(event?.registration_mode || "TEAM").trim().toUpperCase() === "INDIVIDUAL";
  const registrationStatus = getEventRegistrationStatus(event);
  const hubPriorityCounts = useMemo(
    () =>
      myHubMemberships.reduce(
        (accumulator, membership) => {
          const priority = String(membership?.hub_priority || "").toUpperCase();
          if (!priority) return accumulator;
          return {
            ...accumulator,
            [priority]: (accumulator[priority] || 0) + 1
          };
        },
        {
          PROMINENT: 0,
          MEDIUM: 0,
          LOW: 0
        }
      ),
    [myHubMemberships]
  );
  const missingHubRequirements = useMemo(
    () =>
      HUB_RULE_REQUIREMENTS.filter(
        (entry) => Number(hubPriorityCounts[entry.key]) < entry.required
      ).map((entry) => ({
        ...entry,
        current: Number(hubPriorityCounts[entry.key]) || 0,
        remaining: entry.required - (Number(hubPriorityCounts[entry.key]) || 0)
      })),
    [hubPriorityCounts]
  );
  const allowedHubIdSet = useMemo(
    () =>
      new Set(
        getEventAllowedHubRows(event)
          .map((hub) => Number(hub?.hub_id ?? hub?.team_id))
          .filter((value) => Number.isInteger(value))
      ),
    [event]
  );
  const hasAllowedHubMembership = useMemo(() => {
    if (allowedHubIdSet.size === 0) {
      return true;
    }

    return myHubMemberships.some((membership) =>
      allowedHubIdSet.has(Number(membership.team_id))
    );
  }, [allowedHubIdSet, myHubMemberships]);
  const missingHubSummary = missingHubRequirements
    .map((entry) => `${entry.remaining} ${entry.label}`)
    .join(", ");
  const studentApplicationsEnabled =
    event?.apply_by_student === undefined || event?.apply_by_student === null
      ? true
      : ["true", "1", "yes", "y"].includes(
          String(event.apply_by_student).trim().toLowerCase()
        );
  const createDisabled =
      !eventActive ||
      !studentApplicationsEnabled ||
      !registrationStatus.isOpen ||
      missingHubRequirements.length > 0 ||
      !hasAllowedHubMembership ||
      !!myActiveMembershipInEvent ||
      savingTeam;
  const createDisabledReason = !eventActive
    ? `This event is not active, so new ${individualRegistration ? "individual" : "team"} registrations cannot be created.`
    : !studentApplicationsEnabled
      ? "Student applications are disabled for this event."
    : !registrationStatus.isOpen
      ? "Registration is not open for this event right now."
      : missingHubRequirements.length > 0
        ? `Complete your hub quota first. Still needed: ${missingHubSummary}.`
      : !hasAllowedHubMembership
        ? `This event is restricted to ${getEventAllowedHubSummary(event)}. Join one of those hubs first.`
      : myActiveMembershipInEvent
      ? `You already belong to ${myActiveMembershipInEvent.team_code || myActiveMembershipInEvent.team_name}.`
      : "";
  const hasActiveFilters =
    Boolean(String(query || "").trim()) ||
    statusFilter !== "ALL" ||
    requestStatusFilter !== "ALL";
  const filterFields = useMemo(
    () => [
      {
        key: "query",
        type: "search",
        label: "Search",
        value: query,
        placeholder: "Search by team, status, or request state",
        onChangeValue: setQuery
      },
      {
        key: "status",
        type: "select",
        label: "Group Status",
        value: statusFilter,
        onChangeValue: setStatusFilter,
        wrapperClassName: "w-full sm:w-[180px]",
        options: [
          { value: "ALL", label: "All group statuses" },
          ...EVENT_GROUP_STATUS_OPTIONS.map((status) => ({
            value: status,
            label: formatLabel(status)
          }))
        ]
      },
      {
        key: "requestStatus",
        type: "select",
        label: "My Request",
        value: requestStatusFilter,
        onChangeValue: setRequestStatusFilter,
        wrapperClassName: "w-full sm:w-[190px]",
        options: [
          { value: "ALL", label: "All request states" },
          ...EVENT_GROUP_REQUEST_STATE_OPTIONS.map((status) => ({
            value: status,
            label: formatLabel(status)
          }))
        ]
      }
    ],
    [query, requestStatusFilter, statusFilter]
  );
  const headerDescription = event
    ? `${getEventRegistrationModeLabel(event)} registration workspace for ${event.event_code || event.event_name}. ${getEventHubRestrictionLabel(event)}.`
    : "Review registrations, request states, and event details from one clean workspace.";
  const membershipText = myActiveMembershipInEvent
    ? `You belong to ${myActiveMembershipInEvent.team_code || myActiveMembershipInEvent.team_name}`
    : missingHubRequirements.length > 0
      ? `Hub quota pending: ${missingHubSummary}`
      : !hasAllowedHubMembership
        ? `Join one of these hubs first: ${getEventAllowedHubSummary(event)}`
        : individualRegistration
          ? "Review this event before registering individually"
          : "Review this event before registering a team";

  const handleViewGroup = useCallback(
    (team) => {
      if (!team?.team_id) return;
      navigate(`/events/${eventId}/groups/${team.team_id}`);
    },
    [eventId, navigate]
  );

  const handleChangeField = useCallback((field, value) => {
    setTeamForm((previous) => ({ ...previous, [field]: value }));
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    if (createDisabled) return;
    if (individualRegistration) return;
    setInviteSearchQuery("");
    setInviteSearchRows([]);
    setSelectedInvitees([]);
    setCreateModalOpen(true);
  }, [createDisabled, individualRegistration]);

  const handleCloseCreateModal = useCallback(() => {
    if (savingTeam) return;
    setInviteSearchQuery("");
    setInviteSearchRows([]);
    setSelectedInvitees([]);
    setCreateModalOpen(false);
  }, [savingTeam]);

  const maxInviteeCount = useMemo(() => {
    const maxMembers = Number(event?.max_members);
    if (!Number.isInteger(maxMembers) || maxMembers <= 0) return null;
    return Math.max(0, maxMembers - 1);
  }, [event?.max_members]);

  const visibleInviteSearchRows = useMemo(() => {
    const selectedIds = new Set(selectedInvitees.map((row) => String(row.student_id)));
    return inviteSearchRows.filter((row) => !selectedIds.has(String(row.student_id)));
  }, [inviteSearchRows, selectedInvitees]);

  const handleAddInvitee = useCallback(
    (student) => {
      if (!student?.student_id) return;

      if (
        maxInviteeCount !== null &&
        selectedInvitees.length >= maxInviteeCount
      ) {
        setError(`This event allows only ${Number(event?.max_members) || 0} total team members.`);
        return;
      }

      setSelectedInvitees((previousValue) => {
        if (
          previousValue.some(
            (row) => String(row.student_id) === String(student.student_id)
          )
        ) {
          return previousValue;
        }
        return [...previousValue, student];
      });
      setInviteSearchQuery("");
      setInviteSearchRows([]);
    },
    [event?.max_members, maxInviteeCount, selectedInvitees.length]
  );

  const handleRemoveInvitee = useCallback((studentId) => {
    setSelectedInvitees((previousValue) =>
      previousValue.filter((row) => String(row.student_id) !== String(studentId))
    );
  }, []);

  const handleCreateGroup = useCallback(
    async (submitEvent) => {
      submitEvent.preventDefault();
      if (!eventId) return;

      setSavingTeam(true);
      setError("");

      try {
        const payload = {
          team_code: String(teamForm.team_code || "").trim().toUpperCase(),
          team_name: String(teamForm.team_name || "").trim(),
          description: String(teamForm.description || "").trim(),
          invited_student_ids: selectedInvitees.map((row) => row.student_id)
        };

        if (!payload.team_code || !payload.team_name) {
          throw new Error("Team code and team name are required");
        }

        const created = await createEventGroup(eventId, payload);
        setTeamForm(EMPTY_EVENT_GROUP_FORM);
        setSelectedInvitees([]);
        setInviteSearchQuery("");
        setInviteSearchRows([]);
        setCreateModalOpen(false);
        await load();

        const createdTeamId = created?.data?.team?.team_id || created?.team?.team_id;
        if (createdTeamId) {
          navigate(`/events/${eventId}/groups/${createdTeamId}`);
        }
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to register team");
      } finally {
        setSavingTeam(false);
      }
    },
    [eventId, load, navigate, selectedInvitees, teamForm]
  );

  const handleDirectRegistration = useCallback(async () => {
    if (!eventId || createDisabled || !individualRegistration) return;

    setSavingTeam(true);
    setError("");

    try {
      const created = await registerIndividualEvent(eventId);
      await load();

      const createdTeamId = created?.data?.team?.team_id || created?.team?.team_id;
      if (createdTeamId) {
        navigate(`/events/${eventId}/groups/${createdTeamId}`);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to register for the event"
      );
    } finally {
      setSavingTeam(false);
    }
  }, [createDisabled, eventId, individualRegistration, load, navigate]);

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <WorkspacePageHeader
        eyebrow={individualRegistration ? "Registered Participants" : "Registered Teams"}
        title={
          event?.event_name ||
          (individualRegistration ? "Registered Participants" : "Registered Teams")
        }
        description={headerDescription}
        actions={
          <>
            <WorkspacePageHeaderActionButton
              type="button"
              onClick={() => navigate("/events")}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              Back to Events
            </WorkspacePageHeaderActionButton>
            <WorkspacePageHeaderActionButton
              type="button"
              onClick={individualRegistration ? handleDirectRegistration : handleOpenCreateModal}
              disabled={createDisabled}
              title={createDisabledReason}
              className="border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf] hover:bg-[#1754cf]/12 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <AddCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />
              {savingTeam
                ? "Registering..."
                : individualRegistration
                  ? "Register Individually"
                  : "Register Team"}
            </WorkspacePageHeaderActionButton>
            <WorkspacePageHeaderActionButton
              type="button"
              onClick={load}
              disabled={loading}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              {loading ? "Refreshing..." : "Refresh"}
            </WorkspacePageHeaderActionButton>
          </>
        }
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!eventActive && event ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This event is not active, so new {individualRegistration ? "individual" : "team"} registrations cannot be created right now.
        </div>
      ) : null}

      {event && !studentApplicationsEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Student applications are disabled for this event.
        </div>
      ) : null}

      {event && !registrationStatus.isOpen ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {registrationStatus.label}. New {individualRegistration ? "individual" : "team"} registrations are unavailable right now.
        </div>
      ) : null}

      {event ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Hub access: {getEventHubRestrictionLabel(event)}. {getEventAllowedHubSummary(event)}
        </div>
      ) : null}

      {missingHubRequirements.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Complete the hub quota before participating in events. Still needed: {missingHubSummary}.
        </div>
      ) : null}

      {event && missingHubRequirements.length === 0 && !hasAllowedHubMembership ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This event is restricted to {getEventAllowedHubSummary(event)}. Join one of those hubs to participate.
        </div>
      ) : null}

      {myActiveMembershipInEvent ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You already belong to{" "}
          <span className="font-semibold">
            {myActiveMembershipInEvent.team_code || myActiveMembershipInEvent.team_name}
          </span>{" "}
          in this event.
        </div>
      ) : null}

      {event ? (
        <EventSummaryPanel
          event={event}
          eyebrow="Selected Event"
          title="Participation Summary"
          membershipText={membershipText}
        />
      ) : null}

      <div className="lg:hidden">
        <WorkspaceFilterBar
          fields={filterFields}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
        <EventGroupsMobileCards
          rows={filteredRows}
          loading={loading}
          latestRequestByTeamId={latestRequestByTeamId}
          myTeamIdSet={myTeamIdSet}
          onView={handleViewGroup}
          registrationMode={event?.registration_mode}
        />
      </section>

      <TeamDesktopTableShell
        canReset={hasActiveFilters}
        onReset={resetFilters}
        toolbar={
          <WorkspaceFilterBar
            fields={filterFields}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            showReset={false}
          />
        }
      >
        <EventGroupsTable
          rows={filteredRows}
          loading={loading}
          latestRequestByTeamId={latestRequestByTeamId}
          myTeamIdSet={myTeamIdSet}
          onView={handleViewGroup}
          registrationMode={event?.registration_mode}
        />
      </TeamDesktopTableShell>

      {!individualRegistration ? (
        <EventGroupCreateModal
          event={event}
          eventActive={eventActive}
          inviteSearchLoading={inviteSearchLoading}
          inviteSearchQuery={inviteSearchQuery}
          inviteSearchRows={visibleInviteSearchRows}
          maxInviteeCount={maxInviteeCount}
          myActiveMembershipInEvent={myActiveMembershipInEvent}
          onAddInvitee={handleAddInvitee}
          onChangeField={handleChangeField}
          onChangeInviteSearchQuery={setInviteSearchQuery}
          onClose={handleCloseCreateModal}
          onRemoveInvitee={handleRemoveInvitee}
          onSubmit={handleCreateGroup}
          open={createModalOpen}
          selectedInvitees={selectedInvitees}
          saving={savingTeam}
          teamForm={teamForm}
        />
      ) : null}
    </div>
  );
}
