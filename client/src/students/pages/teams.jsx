import { useCallback, useEffect, useMemo, useState } from "react";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "../components/allGroups/AllGroupsBadge";
import {
  TeamDesktopTableShell,
  TeamTableFilterPanel,
  TeamTableHeaderFilterButton,
  TeamTableSearchField,
  TeamTableSelectField
} from "../components/teams/TeamDesktopTableControls";
import TeamMembersPreviewModal from "../components/teams/TeamMembersPreviewModal";
import TeamPageDetailTile from "../components/teams/TeamPageDetailTile";
import TeamPageFilters from "../components/teams/TeamPageFilters";
import TeamPageHero from "../components/teams/TeamPageHero";
import {
  createEventGroup,
  fetchEventGroupMemberships,
  fetchEventGroupsByEvent,
  fetchMyEventGroupMemberships
} from "../../service/teams.api";
import { fetchEvents } from "../../service/events.api";
import {
  applyEventJoinRequest,
  getMyEventJoinRequests
} from "../../service/eventJoinRequests.api";
import {
  formatLabel,
  formatMemberCount,
  formatShortDate,
  normalizeValue
} from "../components/teams/teamPage.utils";

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const selectClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const EMPTY_TEAM_FORM = {
  team_code: "",
  team_name: "",
  description: ""
};

export default function TeamsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [teams, setTeams] = useState([]);
  const [myActiveMemberships, setMyActiveMemberships] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");
  const [busyTeamId, setBusyTeamId] = useState(null);
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM);
  const [viewTeam, setViewTeam] = useState(null);
  const [viewMembers, setViewMembers] = useState([]);
  const [viewMembersLoading, setViewMembersLoading] = useState(false);
  const [viewMembersError, setViewMembersError] = useState("");
  const [viewBusyTeamId, setViewBusyTeamId] = useState(null);

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventRows, myRes, requestRows] = await Promise.all([
        fetchEvents(),
        fetchMyEventGroupMemberships({ status: "ACTIVE" }),
        getMyEventJoinRequests()
      ]);

      const normalizedEvents = Array.isArray(eventRows) ? eventRows : [];
      setEvents(normalizedEvents);
      setMyActiveMemberships(Array.isArray(myRes?.memberships) ? myRes.memberships : []);
      setMyRequests(Array.isArray(requestRows) ? requestRows : []);

      setSelectedEventId((prev) => {
        if (prev && normalizedEvents.some((event) => String(event.event_id) === String(prev))) {
          return prev;
        }

        const activeEvent = normalizedEvents.find(
          (event) => normalizeValue(event.status) === "ACTIVE"
        );

        return activeEvent
          ? String(activeEvent.event_id)
          : normalizedEvents[0]
            ? String(normalizedEvents[0].event_id)
            : "";
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load events and event groups");
      setEvents([]);
      setMyActiveMemberships([]);
      setMyRequests([]);
      setSelectedEventId("");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTeamsForEvent = useCallback(async (eventId) => {
    if (!eventId) {
      setTeams([]);
      return;
    }

    setLoadingTeams(true);
    setError("");

    try {
      const rows = await fetchEventGroupsByEvent(eventId);
      setTeams(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load event groups for event");
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!selectedEventId) {
      setTeams([]);
      return;
    }

    loadTeamsForEvent(selectedEventId);
  }, [loadTeamsForEvent, selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((event) => String(event.event_id) === String(selectedEventId)) || null,
    [events, selectedEventId]
  );

  const myActiveMembershipInSelectedEvent = useMemo(
    () =>
      myActiveMemberships.find(
        (membership) => String(membership.event_id || "") === String(selectedEventId)
      ) || null,
    [myActiveMemberships, selectedEventId]
  );

  const myTeamIdSet = useMemo(
    () => new Set(myActiveMemberships.map((row) => Number(row.team_id))),
    [myActiveMemberships]
  );

  const latestRequestByTeamId = useMemo(() => {
    const map = new Map();

    for (const row of myRequests) {
      const key = Number(row.team_id);
      if (!Number.isFinite(key) || map.has(key)) continue;
      map.set(key, row);
    }

    return map;
  }, [myRequests]);

  const pendingRequestTeamIdSet = useMemo(() => {
    const set = new Set();

    for (const row of myRequests) {
      if (normalizeValue(row?.status) === "PENDING") {
        set.add(Number(row.team_id));
      }
    }

    return set;
  }, [myRequests]);

  const pendingCountForSelectedEvent = useMemo(
    () =>
      myRequests.filter(
        (request) =>
          String(request?.event_id || "") === String(selectedEventId) &&
          normalizeValue(request?.status) === "PENDING"
      ).length,
    [myRequests, selectedEventId]
  );

  const filteredTeams = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return teams.filter((team) => {
      const latestRequest = latestRequestByTeamId.get(Number(team.team_id));
      const requestStatus = myTeamIdSet.has(Number(team.team_id))
        ? "ACTIVE_MEMBER"
        : normalizeValue(latestRequest?.status) || "NO_REQUEST";

      const matchesQuery =
        !normalizedQuery ||
        [
          team.team_code,
          team.team_name,
          team.status,
          team.description,
          latestRequest?.status
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "ALL" || normalizeValue(team.status) === statusFilter;
      const matchesRequestStatus =
        requestStatusFilter === "ALL" || requestStatus === requestStatusFilter;

      return matchesQuery && matchesStatus && matchesRequestStatus;
    });
  }, [latestRequestByTeamId, myTeamIdSet, query, requestStatusFilter, statusFilter, teams]);

  const activeFilters = useMemo(() => {
    const items = [];

    if (String(query || "").trim()) {
      items.push(`Search: ${String(query).trim()}`);
    }
    if (statusFilter !== "ALL") {
      items.push(`Status: ${formatLabel(statusFilter)}`);
    }
    if (requestStatusFilter !== "ALL") {
      items.push(`Request: ${formatLabel(requestStatusFilter)}`);
    }

    return items;
  }, [query, requestStatusFilter, statusFilter]);

  const canResetFilters = activeFilters.length > 0;
  const selectedEventActive = normalizeValue(selectedEvent?.status) === "ACTIVE";
  const activeEventCount = useMemo(
    () => events.filter((event) => normalizeValue(event.status) === "ACTIVE").length,
    [events]
  );
  const headerSummary = !selectedEvent
    ? `${events.length} event${events.length === 1 ? "" : "s"} available`
    : filteredTeams.length !== teams.length
      ? `Showing ${filteredTeams.length} of ${teams.length} groups in ${selectedEvent.event_name || selectedEvent.event_code || "the selected event"}`
      : `${teams.length} groups in ${selectedEvent.event_name || selectedEvent.event_code || "the selected event"}`;

  const resetFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("ALL");
    setRequestStatusFilter("ALL");
  }, []);

  const onCreateTeam = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedEventId) return;

      setSavingTeam(true);
      setError("");

      try {
        const payload = {
          team_code: String(teamForm.team_code || "").trim().toUpperCase(),
          team_name: String(teamForm.team_name || "").trim(),
          description: String(teamForm.description || "").trim()
        };

        if (!payload.team_code || !payload.team_name) {
          throw new Error("Event group code and name are required");
        }

        await createEventGroup(selectedEventId, payload);
        setTeamForm(EMPTY_TEAM_FORM);
        await Promise.all([loadBase(), loadTeamsForEvent(selectedEventId)]);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to create event group");
      } finally {
        setSavingTeam(false);
      }
    },
    [loadBase, loadTeamsForEvent, selectedEventId, teamForm]
  );

  const resolveJoinAction = useCallback(
    (team) => {
      const teamId = Number(team?.team_id);
      const isJoined = myTeamIdSet.has(teamId);
      const hasPending = pendingRequestTeamIdSet.has(teamId);
      const isActiveTeam = normalizeValue(team?.status) === "ACTIVE";
      const isBusy = busyTeamId === teamId;

      if (isBusy) {
        return {
          disabled: true,
          label: "Sending...",
          title: "Sending join request"
        };
      }

      if (myActiveMembershipInSelectedEvent) {
        return {
          disabled: true,
          label: isJoined ? "Joined" : "Request Join",
          title: "You already belong to an event group in this event"
        };
      }

      if (isJoined) {
        return {
          disabled: true,
          label: "Joined",
          title: "Already an active member"
        };
      }

      if (hasPending) {
        return {
          disabled: true,
          label: "Requested",
          title: "Request already pending"
        };
      }

      if (!selectedEventActive) {
        return {
          disabled: true,
          label: "Request Join",
          title: "The selected event is not active"
        };
      }

      if (!isActiveTeam) {
        return {
          disabled: true,
          label: "Request Join",
          title: "Only active event groups can accept requests"
        };
      }

      return {
        disabled: false,
        label: "Request Join",
        title: "Send join request"
      };
    },
    [
      busyTeamId,
      myActiveMembershipInSelectedEvent,
      myTeamIdSet,
      pendingRequestTeamIdSet,
      selectedEventActive
    ]
  );

  const onRequestJoin = useCallback(
    async (team) => {
      const joinAction = resolveJoinAction(team);
      if (joinAction.disabled || !team?.team_id) return;

      const ok = window.confirm(
        `Send join request to event group ${team.team_name || team.team_code}?`
      );
      if (!ok) return;

      setBusyTeamId(Number(team.team_id));
      setError("");

      try {
        await applyEventJoinRequest(team.team_id);
        await Promise.all([loadBase(), loadTeamsForEvent(selectedEventId)]);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to send join request");
      } finally {
        setBusyTeamId(null);
      }
    },
    [loadBase, loadTeamsForEvent, resolveJoinAction, selectedEventId]
  );

  const closeViewMembers = useCallback(() => {
    setViewTeam(null);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(false);
    setViewBusyTeamId(null);
  }, []);

  const onViewMembers = useCallback(async (team) => {
    if (!team?.team_id) return;

    setViewTeam(team);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(true);
    setViewBusyTeamId(Number(team.team_id));

    try {
      const rows = await fetchEventGroupMemberships(team.team_id, { status: "ACTIVE" });
      setViewMembers(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setViewMembersError(err?.response?.data?.message || "Failed to load event group members");
      setViewMembers([]);
    } finally {
      setViewMembersLoading(false);
      setViewBusyTeamId(null);
    }
  }, []);

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <TeamPageHero
        loading={loading || loadingTeams}
        onRefresh={loadBase}
        eyebrow="Event Group Discovery"
        title="Event Groups"
        summary={headerSummary}
        actionLabel="Refresh events"
        actionBusyLabel="Refreshing..."
        stats={[
          {
            accentClass: "bg-[#1754cf]",
            detail: `${activeEventCount} active event${activeEventCount === 1 ? "" : "s"} right now`,
            label: "Events",
            value: events.length
          },
          {
            accentClass: "bg-emerald-500",
            detail:
              filteredTeams.length !== teams.length
                ? `Visible ${filteredTeams.length} after filters`
                : "Event groups in the selected event",
            label: "Groups In Event",
            value: teams.length
          },
          {
            accentClass: "bg-sky-500",
            detail: selectedEvent
              ? `Your active group in ${selectedEvent.event_code || selectedEvent.event_name}`
              : "Choose an event to track membership",
            label: "My Event Group",
            value: myActiveMembershipInSelectedEvent?.team_code || "-"
          },
          {
            accentClass: "bg-slate-400",
            detail: "Requests still waiting on a decision",
            label: "Pending Requests",
            value: pendingCountForSelectedEvent
          }
        ]}
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
            Event Context
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Choose your event</h2>
          <p className="mt-1 text-sm text-slate-500">
            The group list and create form update based on the event you select here.
          </p>

          <div className="mt-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Event
              </span>
              <select
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                className={selectClassName}
                disabled={loading || events.length === 0}
              >
                {events.length === 0 ? <option value="">No events available</option> : null}
                {events.map((event) => (
                  <option key={event.event_id} value={event.event_id}>
                    {event.event_name} ({event.event_code}) | {formatLabel(event.status)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <TeamPageDetailTile
              label="Selected Event"
              value={selectedEvent?.event_name || "No event selected"}
              subtext={selectedEvent?.event_code || "Choose an event to continue"}
            />
            <TeamPageDetailTile
              label="Event Status"
              value={
                selectedEvent ? (
                  <AllGroupsBadge value={formatLabel(selectedEvent.status)} />
                ) : (
                  "-"
                )
              }
              subtext={
                selectedEvent
                  ? `${formatShortDate(selectedEvent.start_date)} to ${formatShortDate(selectedEvent.end_date)}`
                  : "No schedule available"
              }
            />
          </div>
        </div>

        <form
          onSubmit={onCreateTeam}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
            Create Group
          </p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Start a new event group</h2>
              <p className="mt-1 text-sm text-slate-500">
                Creating a group makes you the captain for that event group.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <AddCircleOutlineRoundedIcon sx={{ fontSize: 24 }} />
            </div>
          </div>

          {myActiveMembershipInSelectedEvent ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You already belong to <span className="font-semibold">{myActiveMembershipInSelectedEvent.team_code}</span> in this event.
            </div>
          ) : null}

          <div className="mt-4 grid gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Event Group Code
              </span>
              <input
                value={teamForm.team_code}
                onChange={(event) =>
                  setTeamForm((previous) => ({ ...previous, team_code: event.target.value }))
                }
                className={inputClassName}
                placeholder="EVTTEAM01"
                maxLength={50}
                disabled={!selectedEventId || !selectedEventActive || !!myActiveMembershipInSelectedEvent}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Event Group Name
              </span>
              <input
                value={teamForm.team_name}
                onChange={(event) =>
                  setTeamForm((previous) => ({ ...previous, team_name: event.target.value }))
                }
                className={inputClassName}
                placeholder="Code Crushers"
                maxLength={120}
                disabled={!selectedEventId || !selectedEventActive || !!myActiveMembershipInSelectedEvent}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Description
              </span>
              <textarea
                value={teamForm.description}
                onChange={(event) =>
                  setTeamForm((previous) => ({ ...previous, description: event.target.value }))
                }
                className={`${inputClassName} min-h-24 resize-y`}
                placeholder="Share what your event group is about"
                maxLength={255}
                disabled={!selectedEventId || !selectedEventActive || !!myActiveMembershipInSelectedEvent}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={
              savingTeam ||
              !selectedEventId ||
              !selectedEventActive ||
              !!myActiveMembershipInSelectedEvent
            }
            className="mt-4 rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-4 py-2 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {savingTeam ? "Creating..." : "Create Event Group"}
          </button>
        </form>
      </section>

      {!selectedEventId ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Select an event to view its groups.
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
            <TeamPageFilters
              className="lg:hidden"
              activeFilters={activeFilters}
              canReset={canResetFilters}
              itemLabel="event groups"
              onReset={resetFilters}
              panelTitle="Filter Event Groups"
              resultCount={filteredTeams.length}
              totalCount={teams.length}
              withDivider
            >
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Search
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by code, name, status, or description"
                  className={inputClassName}
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Group Status
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className={selectClassName}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="FROZEN">Frozen</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Request State
                  </span>
                  <select
                    value={requestStatusFilter}
                    onChange={(event) => setRequestStatusFilter(event.target.value)}
                    className={selectClassName}
                  >
                    <option value="ALL">All request states</option>
                    <option value="ACTIVE_MEMBER">Active member</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="NO_REQUEST">No request</option>
                  </select>
                </label>
              </div>
            </TeamPageFilters>

            {loading || loadingTeams ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                {loading ? "Loading events..." : "Loading event groups..."}
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                No event groups found for the current event and filters.
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {filteredTeams.map((team) => {
                  const joinAction = resolveJoinAction(team);
                  const teamId = Number(team.team_id);
                  const latestRequest = latestRequestByTeamId.get(teamId);
                  const requestStatus = myTeamIdSet.has(teamId)
                    ? "Active Member"
                    : latestRequest?.status
                      ? formatLabel(latestRequest.status)
                      : "No Request";

                  return (
                    <article
                      key={team.team_id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-bold text-slate-900">
                            {team.team_name || "-"}
                          </h2>
                          <p className="mt-0.5 text-xs text-slate-500">{team.team_code || "No code"}</p>
                        </div>
                        <AllGroupsBadge value={formatLabel(team.status, "Unknown")} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <AllGroupsBadge value={requestStatus} />
                        {selectedEvent ? <AllGroupsBadge value={selectedEvent.event_code || "Event"} /> : null}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <TeamPageDetailTile
                          label="Members"
                          value={formatMemberCount(team.active_member_count)}
                        />
                        <TeamPageDetailTile
                          label="Created"
                          value={formatShortDate(team.created_at)}
                        />
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Description
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {team.description || "No description added."}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewMembers(team)}
                          disabled={viewBusyTeamId === teamId}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                          title="View event group members"
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestJoin(team)}
                          disabled={joinAction.disabled}
                          title={joinAction.title}
                          className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3.5 py-2 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {joinAction.label}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <TeamDesktopTableShell canReset={canResetFilters} onReset={resetFilters}>
            <div className="overflow-x-auto overflow-y-visible rounded-2xl">
              <table className="min-w-[1220px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                      <TeamTableHeaderFilterButton
                        active={String(query || "").trim().length > 0}
                        label="Event Group"
                        panelWidthClass="w-80"
                      >
                        <TeamTableFilterPanel
                          title="Event Group Filter"
                          currentText={String(query || "").trim() || "All event groups"}
                          helperText="Search by code, name, status, or description."
                        >
                          <TeamTableSearchField
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Code, name, status, or description"
                          />
                        </TeamTableFilterPanel>
                      </TeamTableHeaderFilterButton>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                      <TeamTableHeaderFilterButton active={statusFilter !== "ALL"} label="Status">
                        <TeamTableFilterPanel
                          title="Status Filter"
                          currentText={
                            statusFilter === "ALL" ? "All statuses" : formatLabel(statusFilter)
                          }
                          helperText="Show only event groups in a specific status."
                        >
                          <TeamTableSelectField
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                          >
                            <option value="ALL">All statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="FROZEN">Frozen</option>
                            <option value="ARCHIVED">Archived</option>
                          </TeamTableSelectField>
                        </TeamTableFilterPanel>
                      </TeamTableHeaderFilterButton>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                      Members
                    </th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                      <TeamTableHeaderFilterButton
                        active={requestStatusFilter !== "ALL"}
                        label="My Request"
                      >
                        <TeamTableFilterPanel
                          title="Request Filter"
                          currentText={
                            requestStatusFilter === "ALL"
                              ? "All request states"
                              : formatLabel(requestStatusFilter)
                          }
                          helperText="Filter by your membership or join-request state."
                        >
                          <TeamTableSelectField
                            value={requestStatusFilter}
                            onChange={(event) => setRequestStatusFilter(event.target.value)}
                          >
                            <option value="ALL">All request states</option>
                            <option value="ACTIVE_MEMBER">Active member</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="NO_REQUEST">No request</option>
                          </TeamTableSelectField>
                        </TeamTableFilterPanel>
                      </TeamTableHeaderFilterButton>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                      Description
                    </th>
                    <th className="sticky right-0 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.14)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading || loadingTeams ? (
                    <tr>
                      <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={7}>
                        {loading ? "Loading events..." : "Loading event groups..."}
                      </td>
                    </tr>
                  ) : filteredTeams.length === 0 ? (
                    <tr>
                      <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={7}>
                        No event groups found for the current event and filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((team) => {
                      const joinAction = resolveJoinAction(team);
                      const teamId = Number(team.team_id);
                      const latestRequest = latestRequestByTeamId.get(teamId);
                      const requestStatus = myTeamIdSet.has(teamId)
                        ? "Active Member"
                        : latestRequest?.status
                          ? formatLabel(latestRequest.status)
                          : "No Request";

                      return (
                        <tr key={team.team_id} className="group hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{team.team_name || "-"}</div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {team.team_code || "No code"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <AllGroupsBadge value={formatLabel(team.status, "Unknown")} />
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {formatMemberCount(team.active_member_count)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {formatShortDate(team.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <div>
                                <AllGroupsBadge value={requestStatus} />
                              </div>
                              <div className="text-xs text-slate-500">
                                {latestRequest?.request_date
                                  ? `Requested ${formatShortDate(latestRequest.request_date)}`
                                  : selectedEvent?.event_code || "No request yet"}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="max-w-sm leading-6 text-slate-600">
                              {team.description || "No description added."}
                            </p>
                          </td>
                          <td className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-slate-50/80">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onViewMembers(team)}
                                disabled={viewBusyTeamId === teamId}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                                title="View event group members"
                              >
                                <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onRequestJoin(team)}
                                disabled={joinAction.disabled}
                                title={joinAction.title}
                                className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3 py-1.5 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                {joinAction.label}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TeamDesktopTableShell>
        </>
      )}

      <TeamMembersPreviewModal
        team={viewTeam}
        rows={viewMembers}
        loading={viewMembersLoading}
        error={viewMembersError}
        onClose={closeViewMembers}
        title="Event Group Members"
        subtitle={
          viewTeam
            ? `${viewTeam.team_name || "-"} (${viewTeam.team_code || "-"}) | Event Group ID: ${viewTeam.team_id}`
            : undefined
        }
        emptyText="No active members found for this event group."
      />
    </div>
  );
}
