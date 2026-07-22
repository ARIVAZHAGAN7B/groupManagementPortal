import EventRoundedIcon from "@mui/icons-material/EventRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useEffect, useMemo, useState } from "react";
import { fetchEvents } from "../../service/events.api";
import { fetchTeamTargets, setTeamTarget } from "../../service/teamTargets.api";

const ALL_EVENT_ROUNDS = "ALL_EVENT_ROUNDS";
const NON_EVENT_TEAMS = "NON_EVENT_TEAMS";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const getEventRangeLabel = (event) => {
  const start = formatDate(event?.start_date);
  const end = formatDate(event?.end_date);
  if (start === "-" && end === "-") return "Dates not set";
  if (start === end || end === "-") return start;
  if (start === "-") return end;
  return `${start} - ${end}`;
};

const getRoundLabel = (event, index) =>
  event?.event_code ? `${event.event_code}` : `Round ${index + 1}`;

function RoundTab({ active, count, label, onClick, status }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[180px] flex-col rounded-lg border px-4 py-3 text-left transition ${
        active
          ? "border-[#1754cf] bg-[#1754cf] text-white shadow-lg shadow-[#1754cf]/20"
          : "border-slate-200 bg-white text-slate-700 hover:border-[#1754cf]/30 hover:bg-[#1754cf]/5"
      }`}
    >
      <span className="text-xs font-bold uppercase tracking-[0.14em]">{label}</span>
      <span className={`mt-1 text-[11px] font-semibold ${active ? "text-white/80" : "text-slate-400"}`}>
        {count} tracked {count === 1 ? "team" : "teams"}{status ? ` | ${status}` : ""}
      </span>
    </button>
  );
}

function RoundSummary({ event, rows, selectedTab }) {
  const activeMembers = rows.reduce((sum, row) => sum + (Number(row.active_member_count) || 0), 0);
  const configuredTargets = rows.filter((row) => Number(row.target_member_count) > 0).length;
  const targetMembers = rows.reduce((sum, row) => sum + (Number(row.target_member_count) || 0), 0);
  const progress = targetMembers > 0 ? Math.round((activeMembers / targetMembers) * 100) : null;

  const title =
    selectedTab === NON_EVENT_TEAMS
      ? "Regular Team Tracking"
      : event
        ? event.event_name || event.event_code || "Selected Round"
        : "All Event Rounds";

  const subtitle =
    selectedTab === NON_EVENT_TEAMS
      ? "Targets for non-event teams, hubs, and sections."
      : event
        ? `${event.event_code || "Event"} | ${getEventRangeLabel(event)}`
        : "Combined tracking across every event round.";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#1754cf]/10 text-[#1754cf]">
            <EventRoundedIcon sx={{ fontSize: 22 }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1754cf]">
              Selected Round
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[560px]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Teams</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{rows.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Members</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{activeMembers}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Targets</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{configuredTargets}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Progress</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {progress === null ? "-" : `${progress}%`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TeamTargetManagement() {
  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState(ALL_EVENT_ROUNDS);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editedTargetByTeamId, setEditedTargetByTeamId] = useState({});
  const [editedNotesByTeamId, setEditedNotesByTeamId] = useState({});
  const [busyTeamId, setBusyTeamId] = useState(null);

  const loadTargets = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter !== "ALL") params.team_status = statusFilter;

      const [targetData, eventData] = await Promise.all([
        fetchTeamTargets(params),
        fetchEvents()
      ]);
      const normalized = Array.isArray(targetData) ? targetData : [];
      const normalizedEvents = Array.isArray(eventData) ? eventData : [];
      setRows(normalized);
      setEvents(normalizedEvents);
      setEditedTargetByTeamId((prev) => {
        const next = { ...prev };
        for (const row of normalized) {
          const teamId = Number(row.team_id);
          if (!teamId) continue;
          if (next[teamId] === undefined || next[teamId] === null || next[teamId] === "") {
            next[teamId] =
              row.target_member_count === null || row.target_member_count === undefined
                ? ""
                : String(row.target_member_count);
          }
        }
        return next;
      });
      setEditedNotesByTeamId((prev) => {
        const next = { ...prev };
        for (const row of normalized) {
          const teamId = Number(row.team_id);
          if (!teamId) continue;
          if (next[teamId] === undefined) {
            next[teamId] = row.target_notes || "";
          }
        }
        return next;
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load event tracking");
      setRows([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
  }, [statusFilter]);

  const eventRows = useMemo(
    () => rows.filter((row) => String(row.team_type || "").toUpperCase() === "EVENT"),
    [rows]
  );

  const regularRows = useMemo(
    () => rows.filter((row) => String(row.team_type || "").toUpperCase() !== "EVENT"),
    [rows]
  );

  const eventRowsByEventId = useMemo(() => {
    const grouped = new Map();
    for (const row of eventRows) {
      const eventId = Number(row.event_id) || 0;
      grouped.set(eventId, [...(grouped.get(eventId) || []), row]);
    }
    return grouped;
  }, [eventRows]);

  const selectedEvent = useMemo(
    () => events.find((event) => String(event.event_id) === String(selectedTab)) || null,
    [events, selectedTab]
  );

  const tabRows = useMemo(() => {
    if (selectedTab === ALL_EVENT_ROUNDS) return eventRows;
    if (selectedTab === NON_EVENT_TEAMS) return regularRows;
    return eventRowsByEventId.get(Number(selectedTab)) || [];
  }, [eventRows, eventRowsByEventId, regularRows, selectedTab]);

  const filteredRows = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return tabRows;
    return tabRows.filter((row) =>
      [
        row.team_id,
        row.team_code,
        row.team_name,
        row.team_type,
        row.team_status,
        row.event_name,
        row.event_code,
        row.target_member_count
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ")
        .includes(q)
    );
  }, [tabRows, query]);

  const onChangeTarget = (teamId, value) => {
    setEditedTargetByTeamId((prev) => ({
      ...prev,
      [teamId]: value
    }));
  };

  const onChangeNotes = (teamId, value) => {
    setEditedNotesByTeamId((prev) => ({
      ...prev,
      [teamId]: value
    }));
  };

  const onSave = async (row) => {
    const teamId = Number(row.team_id);
    if (!teamId) return;

    const rawTarget = String(editedTargetByTeamId[teamId] ?? "").trim();
    const parsedTarget = Number(rawTarget);
    if (!Number.isInteger(parsedTarget) || parsedTarget <= 0) {
      setError("Target member count must be a positive integer.");
      return;
    }

    setBusyTeamId(teamId);
    setError("");
    try {
      await setTeamTarget(teamId, {
        target_member_count: parsedTarget,
        notes: String(editedNotesByTeamId[teamId] || "").trim()
      });
      await loadTargets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save team target");
    } finally {
      setBusyTeamId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1754cf]">
            Event Rounds
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Team Tracking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a round to view and manage its team targets, active members, and progress.
          </p>
        </div>
        <button
          type="button"
          onClick={loadTargets}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
        >
          <RefreshRoundedIcon sx={{ fontSize: 18 }} />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex min-w-max gap-3">
          <RoundTab
            active={selectedTab === ALL_EVENT_ROUNDS}
            count={eventRows.length}
            label="All Rounds"
            onClick={() => setSelectedTab(ALL_EVENT_ROUNDS)}
          />
          {events.map((event, index) => (
            <RoundTab
              key={event.event_id}
              active={String(selectedTab) === String(event.event_id)}
              count={(eventRowsByEventId.get(Number(event.event_id)) || []).length}
              label={getRoundLabel(event, index)}
              onClick={() => setSelectedTab(String(event.event_id))}
              status={event.status}
            />
          ))}
          <RoundTab
            active={selectedTab === NON_EVENT_TEAMS}
            count={regularRows.length}
            label="Regular Teams"
            onClick={() => setSelectedTab(NON_EVENT_TEAMS)}
          />
        </div>
      </div>

      <RoundSummary event={selectedEvent} rows={tabRows} selectedTab={selectedTab} />

      <div className="flex flex-col gap-3 lg:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
<<<<<<< HEAD
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1754cf]/20 lg:max-w-md"
          placeholder="Search selected round..."
        />

        <select
=======
          className="w-full lg:max-w-md border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          placeholder="Team, type, event..."
        />

        <select
          value={teamTypeFilter}
          onChange={(e) => setTeamTypeFilter(e.target.value)}
          className="w-full lg:w-[170px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        >
          <option value="ALL">All Types</option>
          <option value="TEAM">TEAM</option>
          <option value="SECTION">SECTION</option>
          <option value="EVENT">EVENT</option>
        </select>

        <select
>>>>>>> 87e94e8231058ee4bb28111484afa80acc4a11f4
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1754cf]/20 lg:w-[180px]"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="FROZEN">FROZEN</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-400 shadow-sm">
          Loading event tracking...
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[1280px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {[
                  "Team",
                  "Round",
                  "Status",
                  "Active Members",
                  "Target Members",
                  "Progress",
                  "Notes",
                  "Actions"
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRows.map((row) => {
                const teamId = Number(row.team_id);
                const busy = busyTeamId === teamId;
                const active = Number(row.active_member_count) || 0;
                const targetValue = editedTargetByTeamId[teamId] ?? "";
                const parsedTarget = Number(targetValue);
                const hasTarget = Number.isInteger(parsedTarget) && parsedTarget > 0;
                const progress = hasTarget ? Math.round((active / parsedTarget) * 100) : null;
                const progressLabel = hasTarget ? `${active}/${parsedTarget}` : `${active}/-`;

                return (
                  <tr key={teamId} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{row.team_name || "-"}</div>
                      <div className="text-[11px] text-slate-400">
                        {row.team_code || "-"} | ID: {teamId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {row.event_id ? `${row.event_name || "-"} (${row.event_code || "-"})` : row.team_type || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {row.team_status || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{active}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={targetValue}
                        onChange={(e) => onChangeTarget(teamId, e.target.value)}
                        disabled={busy}
                        className="w-[120px] rounded-md border border-slate-200 px-2 py-1 text-xs"
                        placeholder="e.g. 10"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-slate-700">{progressLabel}</div>
                      <div className="text-[11px] text-slate-400">
                        {progress === null ? "No target" : `${progress}%`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editedNotesByTeamId[teamId] ?? ""}
                        onChange={(e) => onChangeNotes(teamId, e.target.value)}
                        disabled={busy}
                        className="w-[260px] rounded-md border border-slate-200 px-2 py-1 text-xs"
                        placeholder="Optional note"
                        maxLength={255}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onSave(row)}
                        disabled={busy}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    No tracked teams found for this selection.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
