import { useEffect, useMemo, useState } from "react";
import {
  fetchMyTeamMemberships,
  fetchTeamMemberships,
  fetchTeams,
  joinTeam
} from "../../service/teams.api";

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().split("T")[0];
};

export default function TeamsRegularPage() {
  const [teams, setTeams] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyTeamId, setBusyTeamId] = useState(null);
  const [viewTeam, setViewTeam] = useState(null);
  const [viewMembers, setViewMembers] = useState([]);
  const [viewMembersLoading, setViewMembersLoading] = useState(false);
  const [viewMembersError, setViewMembersError] = useState("");
  const [viewBusyTeamId, setViewBusyTeamId] = useState(null);

  const loadBase = async () => {
    setLoading(true);
    setError("");
    try {
      const [teamRows, membershipRes] = await Promise.all([
        fetchTeams({ exclude_team_type: "EVENT" }),
        fetchMyTeamMemberships({ status: "ACTIVE", exclude_team_type: "EVENT" })
      ]);
      setTeams(Array.isArray(teamRows) ? teamRows : []);
      setMyMemberships(Array.isArray(membershipRes?.memberships) ? membershipRes.memberships : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load teams");
      setTeams([]);
      setMyMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    setLoadingTeams(true);
    setError("");
    try {
      const rows = await fetchTeams({ exclude_team_type: "EVENT" });
      setTeams(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load teams");
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  const myTeamIdSet = useMemo(
    () => new Set(myMemberships.map((m) => Number(m.team_id))),
    [myMemberships]
  );

  const filteredTeams = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((row) =>
      [
        row.team_code,
        row.team_name,
        row.team_type,
        row.status,
        row.description
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ")
        .includes(q)
    );
  }, [teams, query]);

  const onJoin = async (team) => {
    if (!team?.team_id) return;
    const ok = window.confirm(`Join team ${team.team_name || team.team_code}?`);
    if (!ok) return;

    setBusyTeamId(Number(team.team_id));
    setError("");
    try {
      await joinTeam(team.team_id);
      await Promise.all([loadBase(), loadTeams()]);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to join team");
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Teams</h1>
          <p className="text-sm text-gray-600">
            Browse regular teams and join directly.
          </p>
        </div>
        <button onClick={loadBase} className="px-3 py-2 rounded border" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Available Teams
          </div>
          <div className="text-lg font-semibold">{teams.length}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            My Active Teams
          </div>
          <div className="text-lg font-semibold">{myMemberships.length}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Filtered
          </div>
          <div className="text-lg font-semibold">{filteredTeams.length}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md border rounded px-3 py-2"
          placeholder="Search teams..."
        />
      </div>

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}

      {loading || loadingTeams ? (
        <div className="p-3 border rounded">Loading teams...</div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Code</th>
                <th className="text-left p-3 border-b">Name</th>
                <th className="text-left p-3 border-b">Type</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Members</th>
                <th className="text-left p-3 border-b">Created</th>
                <th className="text-left p-3 border-b">Description</th>
                <th className="text-left p-3 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => {
                const teamId = Number(team.team_id);
                const isJoined = myTeamIdSet.has(teamId);
                const isActiveTeam = String(team.status || "").toUpperCase() === "ACTIVE";
                const isBusy = busyTeamId === teamId;
                const actionDisabled = isBusy || isJoined || !isActiveTeam;

                return (
                  <tr key={team.team_id} className="hover:bg-gray-50">
                    <td className="p-3 border-b font-semibold">{team.team_code || "-"}</td>
                    <td className="p-3 border-b">{team.team_name || "-"}</td>
                    <td className="p-3 border-b">{team.team_type || "-"}</td>
                    <td className="p-3 border-b">{team.status || "-"}</td>
                    <td className="p-3 border-b">{Number(team.active_member_count || 0)}</td>
                    <td className="p-3 border-b">{formatDateTime(team.created_at)}</td>
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
                          onClick={() => onJoin(team)}
                          disabled={actionDisabled}
                          className="px-3 py-1 rounded border disabled:opacity-60"
                          title={
                            isJoined
                              ? "Already an active member"
                              : !isActiveTeam
                                ? "Team is not active"
                                : "Join team"
                          }
                        >
                          {isBusy ? "Joining..." : isJoined ? "Joined" : "Join"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTeams.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={8}>
                    No teams found.
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
                  {viewTeam.team_name || "-"} ({viewTeam.team_code || "-"})
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
