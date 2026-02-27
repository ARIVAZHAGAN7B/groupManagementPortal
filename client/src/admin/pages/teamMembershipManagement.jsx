import { useEffect, useMemo, useState } from "react";
import {
  fetchAllTeamMemberships,
  leaveTeamMembership,
  updateTeamMembership
} from "../../service/teams.api";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const TEAM_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "MEMBER", "STRATEGIST", "MANAGER"];

export default function TeamMembershipManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editedRoleByMembershipId, setEditedRoleByMembershipId] = useState({});
  const [busyMembershipId, setBusyMembershipId] = useState(null);

  const loadMemberships = async () => {
    setLoading(true);
    setError("");
    try {
      const params =
        statusFilter === "ALL"
          ? {}
          : {
              status: statusFilter
            };
      const data = await fetchAllTeamMemberships(params);
      setRows(Array.isArray(data) ? data : []);
      setEditedRoleByMembershipId((prev) => {
        const next = { ...prev };
        for (const row of Array.isArray(data) ? data : []) {
          if (!next[row.team_membership_id]) {
            next[row.team_membership_id] = String(row.role || "MEMBER").toUpperCase();
          }
        }
        return next;
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load team memberships");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberships();
  }, [statusFilter]);

  const filteredRows = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [
        row.team_membership_id,
        row.student_id,
        row.student_name,
        row.student_email,
        row.team_code,
        row.team_name,
        row.team_type,
        row.status,
        row.role,
        row.event_name,
        row.event_code
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ")
        .includes(q)
    );
  }, [rows, query]);

  const activeCount = useMemo(
    () => rows.filter((row) => String(row.status || "").toUpperCase() === "ACTIVE").length,
    [rows]
  );

  const onRoleChange = (membershipId, role) => {
    setEditedRoleByMembershipId((prev) => ({
      ...prev,
      [membershipId]: role
    }));
  };

  const onSaveRole = async (row) => {
    const membershipId = row?.team_membership_id;
    if (!membershipId) return;
    const nextRole = String(editedRoleByMembershipId[membershipId] || row.role || "MEMBER").toUpperCase();
    if (nextRole === String(row.role || "").toUpperCase()) return;

    setBusyMembershipId(Number(membershipId));
    setError("");
    try {
      await updateTeamMembership(membershipId, { role: nextRole });
      await loadMemberships();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update team membership role");
    } finally {
      setBusyMembershipId(null);
    }
  };

  const onMarkLeft = async (row) => {
    const membershipId = row?.team_membership_id;
    if (!membershipId) return;
    if (!window.confirm(`Mark membership #${membershipId} as LEFT?`)) return;

    setBusyMembershipId(Number(membershipId));
    setError("");
    try {
      await leaveTeamMembership(membershipId);
      await loadMemberships();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to mark team membership as LEFT");
    } finally {
      setBusyMembershipId(null);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Team Membership Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage team and event-group memberships.
          </p>
        </div>
        <button
          onClick={loadMemberships}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Total Memberships
          </p>
          <p className="text-xl font-bold text-gray-800">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Active Memberships
          </p>
          <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Filtered
          </p>
          <p className="text-xl font-bold text-blue-600">{filteredRows.length}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:max-w-md border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          placeholder="Search by student, team, event, role..."
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-[180px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="LEFT">LEFT</option>
        </select>
      </div>

      {error ? (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading team memberships...</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-100">
          <table className="min-w-[1300px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Membership ID",
                  "Student",
                  "Team",
                  "Event",
                  "Role",
                  "Status",
                  "Joined",
                  "Left",
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
                const membershipId = Number(row.team_membership_id);
                const currentRole = String(row.role || "MEMBER").toUpperCase();
                const selectedRole = String(
                  editedRoleByMembershipId[membershipId] || currentRole
                ).toUpperCase();
                const busy = busyMembershipId === membershipId;
                const isActive = String(row.status || "").toUpperCase() === "ACTIVE";

                return (
                  <tr key={membershipId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{membershipId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{row.student_name || "-"}</div>
                      <div className="text-[11px] text-gray-400">{row.student_id || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{row.team_name || "-"}</div>
                      <div className="text-[11px] text-gray-400">
                        {row.team_code || "-"} | {row.team_type || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {row.event_id ? `${row.event_name || "-"} (${row.event_code || "-"})` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={selectedRole}
                        onChange={(e) => onRoleChange(membershipId, e.target.value)}
                        disabled={!isActive || busy}
                        className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white"
                      >
                        {TEAM_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      {row.status || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(row.join_date)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(row.leave_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onSaveRole(row)}
                          disabled={!isActive || busy || selectedRole === currentRole}
                          className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {busy ? "Working..." : "Save Role"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onMarkLeft(row)}
                          disabled={!isActive || busy}
                          className="px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {busy ? "Working..." : "Mark LEFT"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                    No team memberships found.
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
