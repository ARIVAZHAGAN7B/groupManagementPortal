import { useEffect, useMemo, useState } from "react";
import { fetchStudentLeaderboards } from "../../service/eligibility.api";
import { fetchAllPhases } from "../../service/phase.api";

const TABS = [
  { key: "individual", label: "Individual" },
  { key: "leaders", label: "Leaders" },
  { key: "groups", label: "Groups" }
];
const TIER_OPTIONS = ["D", "C", "B", "A"];

const formatPoints = (value) => Number(value || 0).toLocaleString();
const formatDate = (value) => (value ? String(value).slice(0, 10) : "-");

const getPhaseOptionLabel = (phase) => {
  const name = phase?.phase_name || "Unnamed Phase";
  const start = formatDate(phase?.start_date);
  const end = formatDate(phase?.end_date);
  const status = phase?.status ? ` | ${String(phase.status).toUpperCase()}` : "";
  return `${name} (${start} to ${end})${status}`;
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("individual");
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [phases, setPhases] = useState([]);
  const [phaseLoadError, setPhaseLoadError] = useState("");
  const [data, setData] = useState({
    limit: 30,
    filters: {
      phase_id: null,
      tier: null
    },
    points_scope: "TOTAL",
    phase: null,
    individual: [],
    leaders: [],
    groups: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (overrides = {}) => {
    const phaseId = overrides.phaseId ?? selectedPhaseId;
    const tier = overrides.tier ?? selectedTier;
    const params = {};
    if (phaseId) params.phase_id = phaseId;
    if (tier) params.tier = tier;

    setLoading(true);
    setError("");
    try {
      const res = await fetchStudentLeaderboards(params);
      setData({
        limit: Number(res?.limit) || 30,
        filters: {
          phase_id: res?.filters?.phase_id || null,
          tier: res?.filters?.tier || null
        },
        points_scope: res?.points_scope || "TOTAL",
        phase: res?.phase || null,
        individual: Array.isArray(res?.individual) ? res.individual : [],
        leaders: Array.isArray(res?.leaders) ? res.leaders : [],
        groups: Array.isArray(res?.groups) ? res.groups : []
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load leaderboards");
      setData({
        limit: 30,
        filters: {
          phase_id: phaseId || null,
          tier: tier || null
        },
        points_scope: phaseId ? "PHASE" : "TOTAL",
        phase: null,
        individual: [],
        leaders: [],
        groups: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const rows = await fetchAllPhases();
        if (!active) return;
        setPhases(Array.isArray(rows) ? rows : []);
        setPhaseLoadError("");
      } catch (e) {
        if (!active) return;
        setPhases([]);
        setPhaseLoadError(e?.response?.data?.error || "Failed to load phases");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    load({ phaseId: selectedPhaseId, tier: selectedTier });
  }, [selectedPhaseId, selectedTier]);

  const activeRows = useMemo(() => data[activeTab] || [], [data, activeTab]);
  const pointsColumnLabel =
    data.points_scope === "PHASE" ? "Phase Base Points" : "Total Base Points";
  const hasActiveFilters = Boolean(selectedPhaseId || selectedTier);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Leaderboard</h1>
          <p className="text-sm text-gray-600">
            Top {data.limit} rankings by{" "}
            {data.points_scope === "PHASE" ? "phase base points" : "total base points"} for
            individuals, leaders, and groups.
          </p>
          {data.phase ? (
            <p className="text-xs text-blue-700 mt-1">
              Phase: {data.phase.phase_name || data.phase.phase_id} (
              {formatDate(data.phase.start_date)} to {formatDate(data.phase.end_date)})
            </p>
          ) : null}
        </div>
        <button onClick={() => load()} className="px-3 py-2 rounded border w-fit">
          Refresh
        </button>
      </div>

      <div className="p-3 rounded border bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <label className="block">
            <span className="text-xs uppercase tracking-wide font-semibold text-gray-500">
              Phase
            </span>
            <select
              value={selectedPhaseId}
              onChange={(e) => setSelectedPhaseId(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm bg-white"
            >
              <option value="">All Time (Total Base Points)</option>
              {phases.map((phase) => (
                <option key={phase.phase_id} value={phase.phase_id}>
                  {getPhaseOptionLabel(phase)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide font-semibold text-gray-500">
              Tier
            </span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(String(e.target.value || "").toUpperCase())}
              className="mt-1 w-full rounded border px-3 py-2 text-sm bg-white"
            >
              <option value="">All Tiers</option>
              {TIER_OPTIONS.map((tier) => (
                <option key={tier} value={tier}>
                  Tier {tier}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPhaseId("");
                setSelectedTier("");
              }}
              disabled={!hasActiveFilters}
              className="px-3 py-2 rounded border text-sm disabled:opacity-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
        {phaseLoadError ? (
          <div className="mt-2 text-xs text-amber-700">{phaseLoadError}</div>
        ) : null}
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
                <th className="text-left p-3 border-b">{pointsColumnLabel}</th>
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
                <th className="text-left p-3 border-b">{pointsColumnLabel}</th>
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
