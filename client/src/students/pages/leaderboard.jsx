import { useEffect, useMemo, useState } from "react";
import { fetchStudentLeaderboards } from "../../service/eligibility.api";

const TABS = [
  { key: "individual", label: "Individual" },
  { key: "leaders", label: "Leaders" },
  { key: "groups", label: "Groups" }
];

const formatPoints = (value) => Number(value || 0).toLocaleString();

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("individual");
  const [data, setData] = useState({
    limit: 30,
    individual: [],
    leaders: [],
    groups: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchStudentLeaderboards();
      setData({
        limit: Number(res?.limit) || 30,
        individual: Array.isArray(res?.individual) ? res.individual : [],
        leaders: Array.isArray(res?.leaders) ? res.leaders : [],
        groups: Array.isArray(res?.groups) ? res.groups : []
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load leaderboards");
      setData({
        limit: 30,
        individual: [],
        leaders: [],
        groups: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeRows = useMemo(() => data[activeTab] || [], [data, activeTab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Leaderboard</h1>
          <p className="text-sm text-gray-600">
            Top {data.limit} rankings by base points for individuals, leaders, and groups.
          </p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded border w-fit">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Individual
          </div>
          <div className="text-lg font-semibold">{data.individual.length}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Leaders
          </div>
          <div className="text-lg font-semibold">{data.leaders.length}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Groups
          </div>
          <div className="text-lg font-semibold">{data.groups.length}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded border text-sm font-semibold ${
              activeTab === tab.key
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="p-3 rounded border">Loading leaderboard...</div>
      ) : activeTab === "groups" ? (
        <div className="overflow-auto border rounded">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Rank</th>
                <th className="text-left p-3 border-b">Group</th>
                <th className="text-left p-3 border-b">Tier</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Members</th>
                <th className="text-left p-3 border-b">Total Base Points</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row) => (
                <tr key={row.group_id} className="hover:bg-gray-50">
                  <td className="p-3 border-b font-semibold">#{row.rank}</td>
                  <td className="p-3 border-b">
                    <div className="font-medium">{row.group_name || "-"}</div>
                    <div className="text-xs text-gray-500">
                      {row.group_code || "-"} | ID: {row.group_id}
                    </div>
                  </td>
                  <td className="p-3 border-b">{row.tier || "-"}</td>
                  <td className="p-3 border-b">{row.group_status || "-"}</td>
                  <td className="p-3 border-b">{row.active_member_count || 0}</td>
                  <td className="p-3 border-b font-semibold text-blue-700">
                    {formatPoints(row.total_base_points)}
                  </td>
                </tr>
              ))}
              {activeRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={6}>
                    No group leaderboard data available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Rank</th>
                <th className="text-left p-3 border-b">Student</th>
                <th className="text-left p-3 border-b">Email</th>
                <th className="text-left p-3 border-b">Department</th>
                <th className="text-left p-3 border-b">Year</th>
                <th className="text-left p-3 border-b">Group</th>
                <th className="text-left p-3 border-b">Role</th>
                <th className="text-left p-3 border-b">Total Base Points</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row) => (
                <tr key={`${activeTab}-${row.student_id}`} className="hover:bg-gray-50">
                  <td className="p-3 border-b font-semibold">#{row.rank}</td>
                  <td className="p-3 border-b">
                    <div className="font-medium">{row.name || "-"}</div>
                    <div className="text-xs text-gray-500">ID: {row.student_id}</div>
                  </td>
                  <td className="p-3 border-b">{row.email || "-"}</td>
                  <td className="p-3 border-b">{row.department || "-"}</td>
                  <td className="p-3 border-b">{row.year ?? "-"}</td>
                  <td className="p-3 border-b">
                    {row.group_id ? (
                      <div>
                        <div className="font-medium">{row.group_name || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {row.group_code || "-"} | {row.group_tier || "-"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">No group</span>
                    )}
                  </td>
                  <td className="p-3 border-b">{row.membership_role || "-"}</td>
                  <td className="p-3 border-b font-semibold text-blue-700">
                    {formatPoints(row.total_base_points)}
                  </td>
                </tr>
              ))}
              {activeRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={8}>
                    No leaderboard data available.
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
