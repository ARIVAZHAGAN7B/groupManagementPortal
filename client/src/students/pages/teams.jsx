import { useEffect, useMemo, useState } from "react";
import { fetchEvents } from "../../service/events.api";
import {
  createEventTeam,
  fetchMyTeamMemberships,
  fetchTeamMemberships,
  fetchTeamsByEvent
} from "../../service/teams.api";
import {
  applyEventJoinRequest,
  getMyEventJoinRequests
} from "../../service/eventJoinRequests.api";

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

const statusColor = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return "text-green-700";
  if (s === "REJECTED") return "text-red-700";
  if (s === "PENDING") return "text-amber-700";
  return "text-gray-700";
};

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
  const [busyTeamId, setBusyTeamId] = useState(null);
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM);
  const [viewTeam, setViewTeam] = useState(null);
  const [viewMembers, setViewMembers] = useState([]);
  const [viewMembersLoading, setViewMembersLoading] = useState(false);
  const [viewMembersError, setViewMembersError] = useState("");
  const [viewBusyTeamId, setViewBusyTeamId] = useState(null);

  const loadBase = async () => {
    setLoading(true);
    setError("");
    try {
      const [eventRows, myRes, requestRows] = await Promise.all([
        fetchEvents(),
        fetchMyTeamMemberships({ status: "ACTIVE" }),
        getMyEventJoinRequests()
      ]);

      const normalizedEvents = Array.isArray(eventRows) ? eventRows : [];
      setEvents(normalizedEvents);
      setMyActiveMemberships(Array.isArray(myRes?.memberships) ? myRes.memberships : []);
      setMyRequests(Array.isArray(requestRows) ? requestRows : []);

      setSelectedEventId((prev) => {
        if (prev && normalizedEvents.some((e) => String(e.event_id) === String(prev))) return prev;
        const active = normalizedEvents.find(
          (e) => String(e.status || "").toUpperCase() === "ACTIVE"
        );
        return active ? String(active.event_id) : normalizedEvents[0] ? String(normalizedEvents[0].event_id) : "";
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load events/teams data");
      setEvents([]);
      setMyActiveMemberships([]);
      setMyRequests([]);
      setSelectedEventId("");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamsForEvent = async (eventId) => {
    if (!eventId) {
      setTeams([]);
      return;
    }
    setLoadingTeams(true);
    setError("");
    try {
      const rows = await fetchTeamsByEvent(eventId);
      setTeams(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load teams for event");
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    loadTeamsForEvent(selectedEventId);
  }, [selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((e) => String(e.event_id) === String(selectedEventId)) || null,
    [events, selectedEventId]
  );

  const myActiveMembershipInSelectedEvent = useMemo(
    () =>
      myActiveMemberships.find((m) => String(m.event_id || "") === String(selectedEventId)) || null,
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
      if (!Number.isFinite(key)) continue;
      if (!map.has(key)) map.set(key, row);
    }
    return map;
  }, [myRequests]);

  const pendingRequestTeamIdSet = useMemo(() => {
    const set = new Set();
    for (const row of myRequests) {
      if (String(row?.status || "").toUpperCase() === "PENDING") {
        set.add(Number(row.team_id));
      }
    }
    return set;
  }, [myRequests]);

  const filteredTeams = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((team) => {
      const latestReq = latestRequestByTeamId.get(Number(team.team_id));
      const haystack = [
        team.team_code,
        team.team_name,
        team.team_type,
        team.status,
        team.description,
        latestReq?.status
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");
      return haystack.includes(q);
    });
  }, [teams, query, latestRequestByTeamId]);

  const onCreateTeam = async (e) => {
    e.preventDefault();
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
        throw new Error("Team code and team name are required");
      }
      await createEventTeam(selectedEventId, payload);
      setTeamForm(EMPTY_TEAM_FORM);
      await Promise.all([loadBase(), loadTeamsForEvent(selectedEventId)]);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create team");
    } finally {
      setSavingTeam(false);
    }
  };

  const onRequestJoin = async (team) => {
    if (!team?.team_id) return;
    const ok = window.confirm(`Send join request to team ${team.team_name || team.team_code}?`);
    if (!ok) return;

    setBusyTeamId(team.team_id);
    setError("");
    try {
      await applyEventJoinRequest(team.team_id);
      await loadBase();
      await loadTeamsForEvent(selectedEventId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send join request");
    } finally {
      setBusyTeamId(null);
    }
  };

  const closeViewMembers = () => {
    setViewTeam(null);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(false);
    setViewBusyTeamId(null);
  };

  const onViewMembers = async (team) => {
    if (!team?.team_id) return;

    setViewTeam(team);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(true);
    setViewBusyTeamId(Number(team.team_id));

    try {
      const rows = await fetchTeamMemberships(team.team_id, { status: "ACTIVE" });
      setViewMembers(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setViewMembersError(err?.response?.data?.message || "Failed to load team members");
      setViewMembers([]);
    } finally {
      setViewMembersLoading(false);
      setViewBusyTeamId(null);
    }
  };

  const pendingCountForSelectedEvent = useMemo(
    () =>
      myRequests.filter(
        (r) =>
          String(r?.event_id || "") === String(selectedEventId) &&
          String(r?.status || "").toUpperCase() === "PENDING"
      ).length,
    [myRequests, selectedEventId]
  );

  const selectedEventActive = String(selectedEvent?.status || "").toUpperCase() === "ACTIVE";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Event Teams</h1>
          <p className="text-sm text-gray-600">
            Select an event, create a team (you become captain), or request to join a listed team.
          </p>
        </div>
        <button onClick={loadBase} className="px-3 py-2 rounded border" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="w-full md:max-w-lg">
          <label className="block text-sm font-medium mb-1">Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white"
            disabled={loading || events.length === 0}
          >
            {events.length === 0 ? <option value="">No events available</option> : null}
            {events.map((event) => (
              <option key={event.event_id} value={event.event_id}>
                {event.event_name} ({event.event_code}) | {event.status}
              </option>
            ))}
          </select>
        </div>
        {selectedEvent ? (
          <div className="text-sm text-gray-600 rounded border bg-gray-50 px-3 py-2">
            {selectedEvent.event_code} | {formatDate(selectedEvent.start_date)} -{" "}
            {formatDate(selectedEvent.end_date)} | Status: {selectedEvent.status}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">Events</div>
          <div className="text-lg font-semibold">{events.length}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Teams (Selected Event)
          </div>
          <div className="text-lg font-semibold">{teams.length}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            My Team (Selected Event)
          </div>
          <div className="text-lg font-semibold">
            {myActiveMembershipInSelectedEvent ? myActiveMembershipInSelectedEvent.team_code : "-"}
          </div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Pending Requests (Selected Event)
          </div>
          <div className="text-lg font-semibold">{pendingCountForSelectedEvent}</div>
        </div>
      </div>

      <form onSubmit={onCreateTeam} className="border rounded p-4 bg-white space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Create Team In Selected Event</h2>
          {myActiveMembershipInSelectedEvent ? (
            <span className="text-sm text-amber-700">
              You already belong to a team in this event ({myActiveMembershipInSelectedEvent.team_code})
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Team Code</label>
            <input
              value={teamForm.team_code}
              onChange={(e) => setTeamForm((p) => ({ ...p, team_code: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="EVTTEAM01"
              maxLength={50}
              disabled={!selectedEventId || !selectedEventActive || !!myActiveMembershipInSelectedEvent}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Team Name</label>
            <input
              value={teamForm.team_name}
              onChange={(e) => setTeamForm((p) => ({ ...p, team_name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="Code Crushers"
              maxLength={120}
              disabled={!selectedEventId || !selectedEventActive || !!myActiveMembershipInSelectedEvent}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              value={teamForm.description}
              onChange={(e) => setTeamForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="Optional"
              maxLength={255}
              disabled={!selectedEventId || !selectedEventActive || !!myActiveMembershipInSelectedEvent}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={
            savingTeam ||
            !selectedEventId ||
            !selectedEventActive ||
            !!myActiveMembershipInSelectedEvent
          }
          className="px-4 py-2 rounded border"
        >
          {savingTeam ? "Creating..." : "Create Team (Become Captain)"}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md border rounded px-3 py-2"
          placeholder="Search teams in selected event..."
        />
      </div>

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}

      {loading || loadingTeams ? (
        <div className="p-3 border rounded">
          {loading ? "Loading events..." : "Loading teams for event..."}
        </div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="min-w-[1350px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Team ID</th>
                <th className="text-left p-3 border-b">Code</th>
                <th className="text-left p-3 border-b">Name</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Members</th>
                <th className="text-left p-3 border-b">Created</th>
                <th className="text-left p-3 border-b">My Request Status</th>
                <th className="text-left p-3 border-b">Request Date</th>
                <th className="text-left p-3 border-b">Description</th>
                <th className="text-left p-3 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => {
                const teamId = Number(team.team_id);
                const isJoined = myTeamIdSet.has(teamId);
                const latestReq = latestRequestByTeamId.get(teamId);
                const hasPending = pendingRequestTeamIdSet.has(teamId);
                const isActiveTeam = String(team.status || "").toUpperCase() === "ACTIVE";
                const isBusy = busyTeamId === teamId;
                const actionDisabled =
                  isBusy ||
                  isJoined ||
                  hasPending ||
                  !isActiveTeam ||
                  !selectedEventActive ||
                  !!myActiveMembershipInSelectedEvent;

                let actionLabel = "Request Join";
                if (isJoined) actionLabel = "Joined";
                else if (hasPending) actionLabel = "Requested";

                return (
                  <tr key={team.team_id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{team.team_id}</td>
                    <td className="p-3 border-b font-semibold">{team.team_code || "-"}</td>
                    <td className="p-3 border-b">{team.team_name || "-"}</td>
                    <td className="p-3 border-b">{team.status || "-"}</td>
                    <td className="p-3 border-b">{Number(team.active_member_count || 0)}</td>
                    <td className="p-3 border-b">{formatDateTime(team.created_at)}</td>
                    <td className={`p-3 border-b font-semibold ${statusColor(latestReq?.status)}`}>
                      {isJoined ? "ACTIVE MEMBER" : latestReq?.status || "-"}
                    </td>
                    <td className="p-3 border-b">
                      {latestReq?.request_date ? formatDateTime(latestReq.request_date) : "-"}
                    </td>
                    <td className="p-3 border-b max-w-[280px]">
                      <div className="truncate" title={team.description || ""}>
                        {team.description || "-"}
                      </div>
                    </td>
                    <td className="p-3 border-b">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onViewMembers(team)}
                          disabled={viewBusyTeamId === teamId}
                          className="px-3 py-1 rounded border bg-white disabled:opacity-60"
                          title="View active team members"
                        >
                          {viewBusyTeamId === teamId ? "Loading..." : "View"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestJoin(team)}
                          disabled={actionDisabled}
                          className="px-3 py-1 rounded border disabled:opacity-60"
                          title={
                            myActiveMembershipInSelectedEvent
                              ? "You already belong to a team in this event"
                              : isJoined
                                ? "Already an active member"
                                : hasPending
                                  ? "Request already pending"
                                  : !selectedEventActive
                                    ? "Event is not active"
                                    : !isActiveTeam
                                      ? "Team is not active"
                                      : "Send join request"
                          }
                        >
                          {isBusy ? "Sending..." : actionLabel}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTeams.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={10}>
                    No teams found for the selected event.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {viewTeam ? (
        <div
          className="fixed inset-0 z-50 bg-black/30 p-4 flex items-center justify-center"
          onClick={closeViewMembers}
          role="dialog"
          aria-modal="true"
          aria-labelledby="team-members-preview-title"
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-xl border bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b flex items-start justify-between gap-3">
              <div>
                <h2 id="team-members-preview-title" className="text-base font-semibold">
                  Team Members
                </h2>
                <p className="text-sm text-gray-600">
                  {viewTeam.team_name || "-"} ({viewTeam.team_code || "-"}) | Team ID:{" "}
                  {viewTeam.team_id}
                </p>
              </div>
              <button
                type="button"
                onClick={closeViewMembers}
                className="px-3 py-1.5 rounded border text-sm"
              >
                Close
              </button>
            </div>

            {viewMembersError ? (
              <div className="m-4 p-3 rounded border border-red-300 bg-red-50 text-red-700">
                {viewMembersError}
              </div>
            ) : null}

            {viewMembersLoading ? (
              <div className="p-4">Loading team members...</div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-[860px] w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 border-b">Membership ID</th>
                      <th className="text-left p-3 border-b">Student ID</th>
                      <th className="text-left p-3 border-b">Name</th>
                      <th className="text-left p-3 border-b">Email</th>
                      <th className="text-left p-3 border-b">Role</th>
                      <th className="text-left p-3 border-b">Status</th>
                      <th className="text-left p-3 border-b">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewMembers.map((row) => (
                      <tr key={row.team_membership_id} className="hover:bg-gray-50">
                        <td className="p-3 border-b">{row.team_membership_id || "-"}</td>
                        <td className="p-3 border-b">{row.student_id || "-"}</td>
                        <td className="p-3 border-b">{row.student_name || "-"}</td>
                        <td className="p-3 border-b">{row.student_email || "-"}</td>
                        <td className="p-3 border-b">{row.role || "-"}</td>
                        <td className="p-3 border-b">{row.status || "-"}</td>
                        <td className="p-3 border-b">{formatDateTime(row.join_date)}</td>
                      </tr>
                    ))}

                    {viewMembers.length === 0 ? (
                      <tr>
                        <td className="p-3 text-gray-500" colSpan={7}>
                          No active members found for this team.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
