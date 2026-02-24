import { useEffect, useMemo, useState } from "react";
import { fetchEvents } from "../../service/events.api";
import { fetchTeamsByEvent } from "../../service/teams.api";
import {
  decideEventJoinRequest,
  getPendingEventJoinRequestsByTeam,
} from "../../service/eventJoinRequests.api";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const EVENT_STATUS_STYLES = {
  ACTIVE:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-500 border-gray-200",
  ARCHIVED: "bg-amber-50 text-amber-700 border-amber-200",
};

const Badge = ({ value, map }) => {
  if (!value) return <span className="text-gray-300 text-xs">—</span>;
  const cls = map[String(value).toUpperCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${cls}`}>
      {value}
    </span>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
    <p className={`text-xl font-bold ${accent ?? "text-gray-800"}`}>{value}</p>
  </div>
);

const selectCls = "w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1";

export default function EventJoinRequestManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [pendingRows, setPendingRows] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState("");
  const [decisionBusyId, setDecisionBusyId] = useState(null);

  const activeTeams = useMemo(
    () => teams.filter((t) => String(t?.status || "").toUpperCase() === "ACTIVE"),
    [teams]
  );

  const loadEventsAndSelect = async () => {
    setLoadingEvents(true);
    setError("");
    try {
      const rows = await fetchEvents();
      const normalized = Array.isArray(rows) ? rows : [];
      setEvents(normalized);
      setSelectedEventId((prev) => {
        if (prev && normalized.some((row) => String(row.event_id) === String(prev))) return prev;
        const preferred = normalized.find((row) => String(row.status).toUpperCase() === "ACTIVE");
        return preferred
          ? String(preferred.event_id)
          : normalized[0]
          ? String(normalized[0].event_id)
          : "";
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load events");
      setEvents([]);
      setTeams([]);
      setSelectedEventId("");
      setSelectedTeamId("");
      setPendingRows([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadTeamsForEvent = async (eventId) => {
    if (!eventId) {
      setTeams([]);
      setSelectedTeamId("");
      setPendingRows([]);
      return;
    }
    setLoadingTeams(true);
    setError("");
    try {
      const rows = await fetchTeamsByEvent(eventId);
      const normalized = Array.isArray(rows) ? rows : [];
      setTeams(normalized);
      setSelectedTeamId((prev) => {
        if (prev && normalized.some((row) => String(row.team_id) === String(prev))) return prev;
        const preferred = normalized.find((row) => String(row.status).toUpperCase() === "ACTIVE");
        return preferred
          ? String(preferred.team_id)
          : normalized[0]
          ? String(normalized[0].team_id)
          : "";
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load teams for event");
      setTeams([]);
      setSelectedTeamId("");
      setPendingRows([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadPending = async (teamId) => {
    if (!teamId) { setPendingRows([]); return; }
    setLoadingRows(true);
    setError("");
    try {
      const rows = await getPendingEventJoinRequestsByTeam(teamId);
      setPendingRows(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load pending requests");
      setPendingRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => { loadEventsAndSelect(); }, []);
  useEffect(() => { if (selectedEventId) loadTeamsForEvent(selectedEventId); }, [selectedEventId]);
  useEffect(() => { if (selectedTeamId) loadPending(selectedTeamId); }, [selectedTeamId]);

  const onDecision = async (row, status) => {
    const requestId = row?.event_request_id;
    if (!requestId) return;
    setDecisionBusyId(requestId);
    setError("");
    try {
      const reason = status === "APPROVED" ? "Approved by admin" : "Rejected by admin";
      await decideEventJoinRequest(requestId, status, reason);
      await loadPending(selectedTeamId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update request");
    } finally {
      setDecisionBusyId(null);
    }
  };

  const selectedTeam = useMemo(
    () => teams.find((row) => String(row.team_id) === String(selectedTeamId)) ?? null,
    [teams, selectedTeamId]
  );

  const selectedEvent = useMemo(
    () => events.find((row) => String(row.event_id) === String(selectedEventId)) ?? null,
    [events, selectedEventId]
  );

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Event Join Requests</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Review and approve or reject student requests to join teams and events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadEventsAndSelect}
            disabled={loadingEvents}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loadingEvents ? "…" : "Refresh Events"}
          </button>
          <button
            onClick={() => loadTeamsForEvent(selectedEventId)}
            disabled={!selectedEventId || loadingTeams}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loadingTeams ? "…" : "Refresh Teams"}
          </button>
          <button
            onClick={() => loadPending(selectedTeamId)}
            disabled={!selectedTeamId || loadingRows}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loadingRows ? "…" : "Refresh Requests"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Events" value={events.length} />
        <StatCard label="Active Teams in Event" value={activeTeams.length} accent="text-blue-600" />
        <StatCard
          label="Pending Requests"
          value={pendingRows.length}
          accent={pendingRows.length > 0 ? "text-amber-600" : "text-gray-800"}
        />
      </div>

      {/* Selectors + Context */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className={selectCls}
              disabled={loadingEvents || events.length === 0}
            >
              {events.length === 0 && <option value="">No events available</option>}
              {events.map((event) => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_name} ({event.event_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Team</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className={selectCls}
              disabled={loadingTeams || teams.length === 0}
            >
              {teams.length === 0 && <option value="">No teams available</option>}
              {teams.map((team) => (
                <option key={team.team_id} value={team.team_id}>
                  {team.team_name} ({team.team_code}) · {team.team_type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Context pills */}
        {(selectedEvent || selectedTeam) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedEvent && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs">
                <span className="text-gray-400">Event</span>
                <span className="font-semibold text-gray-700">{selectedEvent.event_name}</span>
                <Badge value={selectedEvent.status} map={EVENT_STATUS_STYLES} />
              </div>
            )}
            {selectedTeam && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs">
                <span className="text-gray-400">Team</span>
                <span className="font-semibold text-gray-700">{selectedTeam.team_name}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{Number(selectedTeam.active_member_count || 0)} active members</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loadingRows ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading pending requests…</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-100">
          <table className="min-w-[780px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Student", "Email", "Department", "Year", "Request Date", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingRows.map((row) => (
                <tr key={row.event_request_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{row.student_name || "—"}</div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">{row.student_id || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.student_email || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{row.department || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{row.year ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(row.request_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDecision(row, "APPROVED")}
                        disabled={decisionBusyId === row.event_request_id}
                        className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {decisionBusyId === row.event_request_id ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDecision(row, "REJECTED")}
                        disabled={decisionBusyId === row.event_request_id}
                        className="px-3 py-1 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        {decisionBusyId === row.event_request_id ? "…" : "Reject"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pendingRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    No pending requests for the selected team.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}