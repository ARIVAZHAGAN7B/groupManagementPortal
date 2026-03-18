import { useCallback, useEffect, useMemo, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import { useNavigate, useParams } from "react-router-dom";
import { fetchEventById } from "../../../service/events.api";
import { getMyEventJoinRequests } from "../../../service/eventJoinRequests.api";
import {
  createEventGroup,
  fetchEventGroupsByEvent,
  fetchMyEventGroupMemberships
} from "../../../service/teams.api";
import TeamPageFilters from "../teams/TeamPageFilters";
import TeamPageHero from "../teams/TeamPageHero";
import {
  TeamDesktopTableShell,
  TeamTableSearchField,
  TeamTableSelectField
} from "../teams/TeamDesktopTableControls";
import { formatLabel, normalizeValue } from "../teams/teamPage.utils";
import EventGroupCreateModal from "./EventGroupCreateModal";
import EventGroupsMobileCards from "./EventGroupsMobileCards";
import EventGroupsTable from "./EventGroupsTable";
import EventSummaryPanel from "./EventSummaryPanel";
import {
  EMPTY_EVENT_GROUP_FORM,
  EVENT_GROUP_REQUEST_STATE_OPTIONS,
  EVENT_GROUP_STATUS_OPTIONS,
  getEventDateRangeLabel,
  getEventGroupRequestStatus,
  getEventLocationLabel,
  getEventMemberLimitLabel,
  getEventRegistrationStatus
} from "./events.constants";

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const selectClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

export default function StudentEventGroupsPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [rows, setRows] = useState([]);
  const [myActiveMemberships, setMyActiveMemberships] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState(EMPTY_EVENT_GROUP_FORM);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventRow, groupRows, membershipRes, requestRows] = await Promise.all([
        fetchEventById(eventId),
        fetchEventGroupsByEvent(eventId),
        fetchMyEventGroupMemberships({ status: "ACTIVE" }),
        getMyEventJoinRequests()
      ]);

      setEvent(eventRow || null);
      setRows(Array.isArray(groupRows) ? groupRows : []);
      setMyActiveMemberships(
        Array.isArray(membershipRes?.memberships) ? membershipRes.memberships : []
      );
      setMyRequests(Array.isArray(requestRows) ? requestRows : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load event groups");
      setEvent(null);
      setRows([]);
      setMyActiveMemberships([]);
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setTeamForm(EMPTY_EVENT_GROUP_FORM);
    setCreateModalOpen(false);
  }, [eventId]);

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

  const activeFilters = useMemo(() => {
    const items = [];

    if (String(query || "").trim()) {
      items.push(`Search: ${String(query).trim()}`);
    }

    if (statusFilter !== "ALL") {
      items.push(`Status: ${formatLabel(statusFilter)}`);
    }

    if (requestStatusFilter !== "ALL") {
      items.push(`My Request: ${formatLabel(requestStatusFilter)}`);
    }

    return items;
  }, [query, requestStatusFilter, statusFilter]);

  const resetFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("ALL");
    setRequestStatusFilter("ALL");
  }, []);

  const eventActive = normalizeValue(event?.status) === "ACTIVE";
  const registrationStatus = getEventRegistrationStatus(event);
  const createDisabled =
    !eventActive || !registrationStatus.isOpen || !!myActiveMembershipInEvent || savingTeam;
  const createDisabledReason = !eventActive
    ? "This event is not active, so new groups cannot be created."
    : !registrationStatus.isOpen
      ? "Registration is not open for this event right now."
    : myActiveMembershipInEvent
      ? `You already belong to ${myActiveMembershipInEvent.team_code || myActiveMembershipInEvent.team_name}.`
      : "";
  const eventTimeline = getEventDateRangeLabel(event);
  const eventLocation = event ? getEventLocationLabel(event) : "-";

  const headerSummary = event
    ? filteredRows.length !== rows.length
      ? `Showing ${filteredRows.length} of ${rows.length} event groups for ${event.event_name || event.event_code}`
      : `${rows.length} event groups currently registered for ${event.event_name || event.event_code}`
    : "Loading event groups";

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
    setCreateModalOpen(true);
  }, [createDisabled]);

  const handleCloseCreateModal = useCallback(() => {
    if (savingTeam) return;
    setCreateModalOpen(false);
  }, [savingTeam]);

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
          description: String(teamForm.description || "").trim()
        };

        if (!payload.team_code || !payload.team_name) {
          throw new Error("Event group code and name are required");
        }

        const created = await createEventGroup(eventId, payload);
        setTeamForm(EMPTY_EVENT_GROUP_FORM);
        setCreateModalOpen(false);
        await load();

        const createdTeamId = created?.data?.team?.team_id || created?.team?.team_id;
        if (createdTeamId) {
          navigate(`/events/${eventId}/groups/${createdTeamId}`);
        }
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to create event group");
      } finally {
        setSavingTeam(false);
      }
    },
    [eventId, load, navigate, teamForm]
  );

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <TeamPageHero
        loading={loading}
        onRefresh={load}
        eyebrow="Event Groups"
        title={event?.event_name || "Event Groups"}
        summary={headerSummary}
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate("/events")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              Back to Events
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              disabled={createDisabled}
              title={createDisabledReason}
              className="inline-flex items-center gap-2 rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-4 py-2 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <AddCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />
              Create New Group
            </button>
          </>
        }
        actionLabel="Refresh groups"
        actionBusyLabel="Refreshing..."
        stats={[
          {
            accentClass: "bg-[#1754cf]",
            label: "Event Code",
            value: event?.event_code || "-"
          },
          {
            accentClass: "bg-emerald-500",
            label: "Timeline",
            value: eventTimeline
          },
          {
            accentClass: "bg-sky-500",
            label: "Location",
            value: eventLocation
          },
          {
            accentClass: "bg-slate-400",
            label: "Member Limits",
            value: getEventMemberLimitLabel(event)
          }
        ]}
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!eventActive && event ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This event is not active, so new event groups cannot be created right now.
        </div>
      ) : null}

      {event && !registrationStatus.isOpen ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {registrationStatus.label}. New event groups and registrations are unavailable right now.
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
          title="Event Details"
          groupCount={rows.length}
          membershipText={
            myActiveMembershipInEvent
              ? `You belong to ${myActiveMembershipInEvent.team_code || myActiveMembershipInEvent.team_name}`
              : "Review this event before creating or joining a group"
          }
        />
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
        <TeamPageFilters
          className="lg:hidden"
          activeFilters={activeFilters}
          canReset={activeFilters.length > 0}
          itemLabel="event groups"
          onReset={resetFilters}
          panelTitle="Filter Event Groups"
          resultCount={filteredRows.length}
          totalCount={rows.length}
          withDivider
        >
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Search
            </span>
            <input
              value={query}
              onChange={(inputEvent) => setQuery(inputEvent.target.value)}
              placeholder="Search by event group, status, or request state"
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
                onChange={(inputEvent) => setStatusFilter(inputEvent.target.value)}
                className={selectClassName}
              >
                <option value="ALL">All group statuses</option>
                {EVENT_GROUP_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                My Request
              </span>
              <select
                value={requestStatusFilter}
                onChange={(inputEvent) => setRequestStatusFilter(inputEvent.target.value)}
                className={selectClassName}
              >
                <option value="ALL">All request states</option>
                {EVENT_GROUP_REQUEST_STATE_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </TeamPageFilters>

        <EventGroupsMobileCards
          rows={filteredRows}
          loading={loading}
          latestRequestByTeamId={latestRequestByTeamId}
          myTeamIdSet={myTeamIdSet}
          onView={handleViewGroup}
        />
      </section>

      <TeamDesktopTableShell
        canReset={activeFilters.length > 0}
        onReset={resetFilters}
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="min-w-0 xl:w-[22rem]">
              <TeamTableSearchField
                value={query}
                onChange={(inputEvent) => setQuery(inputEvent.target.value)}
                placeholder="Search by event group, status, or request state"
              />
            </div>

            <div className="min-w-0 xl:w-44">
              <TeamTableSelectField
                value={statusFilter}
                onChange={(inputEvent) => setStatusFilter(inputEvent.target.value)}
              >
                <option value="ALL">All group statuses</option>
                {EVENT_GROUP_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </TeamTableSelectField>
            </div>

            <div className="min-w-0 xl:w-48">
              <TeamTableSelectField
                value={requestStatusFilter}
                onChange={(inputEvent) => setRequestStatusFilter(inputEvent.target.value)}
              >
                <option value="ALL">All request states</option>
                {EVENT_GROUP_REQUEST_STATE_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </TeamTableSelectField>
            </div>
          </div>
        }
      >
        <EventGroupsTable
          rows={filteredRows}
          loading={loading}
          latestRequestByTeamId={latestRequestByTeamId}
          myTeamIdSet={myTeamIdSet}
          onView={handleViewGroup}
        />
      </TeamDesktopTableShell>

      <EventGroupCreateModal
        event={event}
        eventActive={eventActive}
        myActiveMembershipInEvent={myActiveMembershipInEvent}
        onChangeField={handleChangeField}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateGroup}
        open={createModalOpen}
        saving={savingTeam}
        teamForm={teamForm}
      />
    </div>
  );
}
