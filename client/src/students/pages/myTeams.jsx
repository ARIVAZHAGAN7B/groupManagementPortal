import { useEffect, useMemo, useState } from "react";
import { fetchMyTeamMemberships } from "../../service/teams.api";

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

export default function MyTeamsPage() {
  const [rows, setRows] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyTeamMemberships({ status: "ACTIVE" });
      setStudentId(data?.student_id || null);
      setRows(Array.isArray(data?.memberships) ? data.memberships : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load my teams");
      setStudentId(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const typeCounts = useMemo(() => {
    return rows.reduce((acc, row) => {
      const key = String(row.team_type || "TEAM").toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">My Teams</h1>
          <p className="text-sm text-gray-600">
            Active team memberships linked to your student account.
          </p>
          {studentId ? (
            <p className="text-xs text-gray-500 mt-1">Student ID: {studentId}</p>
          ) : null}
        </div>
        <button onClick={load} className="px-3 py-2 rounded border" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Active Memberships
          </div>
          <div className="text-lg font-semibold">{rows.length}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">TEAM</div>
          <div className="text-lg font-semibold">{typeCounts.TEAM || 0}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">HUB</div>
          <div className="text-lg font-semibold">{typeCounts.HUB || 0}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            SECTION / EVENT
          </div>
          <div className="text-lg font-semibold">
            {(typeCounts.SECTION || 0) + (typeCounts.EVENT || 0)}
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="p-3 border rounded">Loading my teams...</div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Membership ID</th>
                <th className="text-left p-3 border-b">Event</th>
                <th className="text-left p-3 border-b">Team</th>
                <th className="text-left p-3 border-b">Type</th>
                <th className="text-left p-3 border-b">Team Status</th>
                <th className="text-left p-3 border-b">Event Status</th>
                <th className="text-left p-3 border-b">My Role</th>
                <th className="text-left p-3 border-b">Membership Status</th>
                <th className="text-left p-3 border-b">Join Date</th>
                <th className="text-left p-3 border-b">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.team_membership_id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{row.team_membership_id}</td>
                  <td className="p-3 border-b">
                    {row.event_id ? (
                      <div>
                        <div className="font-medium">{row.event_name || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {row.event_code || "-"} | ID: {row.event_id}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">No event</span>
                    )}
                  </td>
                  <td className="p-3 border-b">
                    <div className="font-medium">{row.team_name || "-"}</div>
                    <div className="text-xs text-gray-500">
                      {row.team_code || "-"} | ID: {row.team_id}
                    </div>
                  </td>
                  <td className="p-3 border-b">{row.team_type || "-"}</td>
                  <td className="p-3 border-b">{row.team_status || "-"}</td>
                  <td className="p-3 border-b">{row.event_status || "-"}</td>
                  <td className="p-3 border-b">{row.role || "-"}</td>
                  <td className="p-3 border-b">{row.status || "-"}</td>
                  <td className="p-3 border-b">{formatDateTime(row.join_date)}</td>
                  <td className="p-3 border-b">{row.notes || "-"}</td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={10}>
                    No active team memberships found.
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
