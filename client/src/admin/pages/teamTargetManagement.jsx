import { useEffect, useMemo, useState } from "react";
import { fetchTeamTargets, setTeamTarget } from "../../service/teamTargets.api";

export default function TeamTargetManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [teamTypeFilter, setTeamTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editedTargetByTeamId, setEditedTargetByTeamId] = useState({});
  const [editedNotesByTeamId, setEditedNotesByTeamId] = useState({});
  const [busyTeamId, setBusyTeamId] = useState(null);

  const loadTargets = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (teamTypeFilter !== "ALL") params.team_type = teamTypeFilter;
      if (statusFilter !== "ALL") params.team_status = statusFilter;

      const data = await fetchTeamTargets(params);
      const normalized = Array.isArray(data) ? data : [];
      setRows(normalized);
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
      setError(err?.response?.data?.message || "Failed to load team targets");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
  }, [teamTypeFilter, statusFilter]);

  const filteredRows = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
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
  }, [rows, query]);

  const stats = useMemo(() => {
    const configuredCount = rows.filter((row) => row.target_configured).length;
    const metCount = rows.filter((row) => {
      if (!row.target_configured) return false;
      return Number(row.active_member_count) >= Number(row.target_member_count);
    }).length;
    return {
      total: rows.length,
      configured: configuredCount,
      met: metCount
    };
  }, [rows]);

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
    <div className="p-6 space-y-5 max-w-screen-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Team Target Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Set and track target member count for each team and event group.
          </p>
        </div>
        <button
          onClick={loadTargets}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Teams
          </p>
          <p className="text-xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Targets Configured
          </p>
          <p className="text-xl font-bold text-blue-600">{stats.configured}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Target Met
          </p>
          <p className="text-xl font-bold text-emerald-600">{stats.met}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full lg:max-w-md border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          placeholder="Search by team, type, event..."
        />

        <select
          value={teamTypeFilter}
          onChange={(e) => setTeamTypeFilter(e.target.value)}
          className="w-full lg:w-[170px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        >
          <option value="ALL">All Types</option>
          <option value="TEAM">TEAM</option>
          <option value="HUB">HUB</option>
          <option value="SECTION">SECTION</option>
          <option value="EVENT">EVENT</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full lg:w-[170px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="FROZEN">FROZEN</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>

      {error ? (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading team targets...</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-100">
          <table className="min-w-[1400px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Team",
                  "Type",
                  "Status",
                  "Event",
                  "Active Members",
                  "Target Members",
                  "Progress",
                  "Notes",
                  "Actions"
                ].map((h) => (
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
                  <tr key={teamId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{row.team_name || "-"}</div>
                      <div className="text-[11px] text-gray-400">
                        {row.team_code || "-"} | ID: {teamId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      {row.team_type || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      {row.team_status || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {row.event_id ? `${row.event_name || "-"} (${row.event_code || "-"})` : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{active}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={targetValue}
                        onChange={(e) => onChangeTarget(teamId, e.target.value)}
                        disabled={busy}
                        className="w-[120px] border border-gray-200 rounded-md px-2 py-1 text-xs"
                        placeholder="e.g. 10"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-gray-700">{progressLabel}</div>
                      <div className="text-[11px] text-gray-400">
                        {progress === null ? "No target" : `${progress}%`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editedNotesByTeamId[teamId] ?? ""}
                        onChange={(e) => onChangeNotes(teamId, e.target.value)}
                        disabled={busy}
                        className="w-[260px] border border-gray-200 rounded-md px-2 py-1 text-xs"
                        placeholder="Optional note"
                        maxLength={255}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onSave(row)}
                        disabled={busy}
                        className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {busy ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                    No team targets found.
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
