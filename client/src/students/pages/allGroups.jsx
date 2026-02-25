import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGroups } from "../../service/groups.api";
import { fetchStudentLeaderboards } from "../../service/eligibility.api";

const TIER_STYLES = {
  A: "bg-blue-50 text-blue-700 border-blue-200",
  B: "bg-purple-50 text-purple-700 border-purple-200",
  C: "bg-orange-50 text-orange-700 border-orange-200",
  D: "bg-gray-100 text-gray-700 border-gray-200"
};

const STATUS_STYLES = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  FROZEN: "bg-blue-50 text-blue-700 border-blue-200"
};

const formatPoints = (value) => Number(value || 0).toLocaleString();
const hasRank = (value) =>
  value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) > 0;

const Badge = ({ value, stylesMap }) => {
  const text = String(value || "-");
  const key = text.toUpperCase();
  const cls = stylesMap?.[key] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
};

const StatCard = ({ label, value, tone = "text-gray-900" }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
    <div className={`mt-2 text-lg font-bold ${tone}`}>{value}</div>
  </div>
);

const toCaptainRankMap = (leaders = []) => {
  const captains = (Array.isArray(leaders) ? leaders : [])
    .filter((row) => String(row?.membership_role || "").toUpperCase() === "CAPTAIN")
    .sort((a, b) => {
      const rankA = Number(a?.rank) || Number.MAX_SAFE_INTEGER;
      const rankB = Number(b?.rank) || Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });

  const map = new Map();
  let captainRank = 0;

  for (const row of captains) {
    const groupId = row?.group_id;
    if (groupId === null || groupId === undefined) continue;
    const key = String(groupId);
    if (map.has(key)) continue;

    captainRank += 1;
    map.set(key, {
      captain_rank: captainRank,
      captain_name: row?.name || null,
      captain_points: Number(row?.total_base_points) || 0
    });
  }

  return map;
};

const toGroupRankMap = (groups = []) => {
  const map = new Map();

  for (const row of Array.isArray(groups) ? groups : []) {
    const groupId = row?.group_id;
    if (groupId === null || groupId === undefined) continue;

    map.set(String(groupId), {
      group_rank: hasRank(row?.rank) ? Number(row.rank) : null,
      active_member_count:
        row?.active_member_count === null || row?.active_member_count === undefined
          ? null
          : Number(row.active_member_count),
      total_base_points:
        row?.total_base_points === null || row?.total_base_points === undefined
          ? null
          : Number(row.total_base_points)
    });
  }

  return map;
};

const rankCell = (value) => (hasRank(value) ? ` ${Number(value)}` : "Not ranked");

export default function AllGroups() {
  const nav = useNavigate();

  const [groups, setGroups] = useState([]);
  const [leaderboards, setLeaderboards] = useState({ leaders: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rankingWarning, setRankingWarning] = useState("");

  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = async () => {
    setLoading(true);
    setErr("");
    setRankingWarning("");

    try {
      const [groupRows, leaderboardRows] = await Promise.all([
        fetchGroups(),
        fetchStudentLeaderboards().catch(() => null)
      ]);

      setGroups(Array.isArray(groupRows) ? groupRows : []);

      if (leaderboardRows) {
        setLeaderboards({
          leaders: Array.isArray(leaderboardRows?.leaders) ? leaderboardRows.leaders : [],
          groups: Array.isArray(leaderboardRows?.groups) ? leaderboardRows.groups : []
        });
      } else {
        setLeaderboards({ leaders: [], groups: [] });
        setRankingWarning("Groups loaded, but ranking data is temporarily unavailable.");
      }
    } catch (e) {
      setErr(e?.response?.data?.error || e?.response?.data?.message || "Failed to load groups");
      setGroups([]);
      setLeaderboards({ leaders: [], groups: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const captainRankMap = useMemo(
    () => toCaptainRankMap(leaderboards.leaders),
    [leaderboards.leaders]
  );

  const groupRankMap = useMemo(
    () => toGroupRankMap(leaderboards.groups),
    [leaderboards.groups]
  );

  const mergedGroups = useMemo(
    () =>
      (Array.isArray(groups) ? groups : []).map((g) => ({
        ...g,
        ...(groupRankMap.get(String(g.group_id)) || {}),
        ...(captainRankMap.get(String(g.group_id)) || {})
      })),
    [groups, captainRankMap, groupRankMap]
  );

  const tierOptions = useMemo(
    () =>
      Array.from(
        new Set(mergedGroups.map((g) => String(g.tier || "").toUpperCase()).filter(Boolean))
      ).sort(),
    [mergedGroups]
  );

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(mergedGroups.map((g) => String(g.status || "").toUpperCase()).filter(Boolean))
      ).sort(),
    [mergedGroups]
  );

  const filtered = useMemo(() => {
    const search = String(q || "").trim().toLowerCase();

    return mergedGroups
      .filter((g) => {
        if (tierFilter !== "ALL" && String(g.tier || "").toUpperCase() !== tierFilter) {
          return false;
        }

        if (statusFilter !== "ALL" && String(g.status || "").toUpperCase() !== statusFilter) {
          return false;
        }

        if (!search) return true;

        const haystack = [
          g.group_name,
          g.tier,
          g.status,
          g.captain_name
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        return haystack.includes(search);
      })
      .sort((a, b) => {
        const aHasRank = hasRank(a.group_rank);
        const bHasRank = hasRank(b.group_rank);

        if (aHasRank && bHasRank && Number(a.group_rank) !== Number(b.group_rank)) {
          return Number(a.group_rank) - Number(b.group_rank);
        }

        if (aHasRank !== bHasRank) return aHasRank ? -1 : 1;

        return String(a.group_name || "").localeCompare(String(b.group_name || ""));
      });
  }, [mergedGroups, q, tierFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = mergedGroups.length;
    const active = mergedGroups.filter((g) => String(g.status || "").toUpperCase() === "ACTIVE").length;
    const rankedGroups = mergedGroups.filter((g) => hasRank(g.group_rank)).length;
    const rankedCaptains = mergedGroups.filter((g) => hasRank(g.captain_rank)).length;

    return { total, active, rankedGroups, rankedCaptains };
  }, [mergedGroups]);

  if (loading && groups.length === 0 && !err) {
    return (
      <div className="p-6">
        <div className="p-3 rounded border">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-screen-2xl">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">All Groups</h1>
            <p className="mt-1 text-sm text-gray-600">
              Table view with group ranking and captain-only ranking (VICE_CAPTAIN excluded).
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading ? <span className="text-xs font-medium text-blue-700">Refreshing...</span> : null}
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Groups" value={stats.total} />
          <StatCard label="Active Groups" value={stats.active} tone="text-emerald-700" />
          <StatCard label="Group Rankings" value={stats.rankedGroups} tone="text-blue-700" />
          <StatCard label="Captain Rankings" value={stats.rankedCaptains} tone="text-purple-700" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
              placeholder="Search by group name, tier, status, captain..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tier</label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="ALL">All Tiers</option>
              {tierOptions.map((tier) => (
                <option key={tier} value={tier}>
                  Tier {tier}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of{" "}
          <span className="font-semibold text-gray-700">{mergedGroups.length}</span> groups
        </div>
      </div>

      {err ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{err}</div>
      ) : null}

      {rankingWarning ? (
        <div className="p-3 rounded border border-amber-300 bg-amber-50 text-amber-800">
          {rankingWarning}
        </div>
      ) : null}

      <div className="overflow-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 border-b">Group Name</th>
              <th className="text-left p-3 border-b">Tier</th>
              <th className="text-left p-3 border-b">Status</th>
              <th className="text-left p-3 border-b">Captain</th>
              <th className="text-left p-3 border-b">Captain Rank</th>
              <th className="text-left p-3 border-b">Group Rank</th>
              <th className="text-left p-3 border-b">Members</th>
              <th className="text-left p-3 border-b">Group Points</th>
              <th className="sticky right-0 z-10 text-left p-3 border-b bg-gray-50 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.group_id} className="group hover:bg-gray-50">
                <td className="p-3 border-b">
                  <div className="font-medium text-gray-900">{g.group_name || "-"}</div>
                </td>
                <td className="p-3 border-b">
                  <Badge value={g.tier || "-"} stylesMap={TIER_STYLES} />
                </td>
                <td className="p-3 border-b">
                  <Badge value={g.status || "-"} stylesMap={STATUS_STYLES} />
                </td>
                <td className="p-3 border-b">
                  <div className="font-medium text-gray-800">{g.captain_name || "Not ranked"}</div>
                  <div className="text-xs text-gray-500">
                    {hasRank(g.captain_rank)
                      ? `${formatPoints(g.captain_points)} pts`
                      : "No Captain"}
                  </div>
                </td>
                <td className="p-3 border-b font-semibold text-purple-700">
                  {rankCell(g.captain_rank)}
                </td>
                <td className="p-3 border-b font-semibold text-blue-700">
                  {rankCell(g.group_rank)}
                </td>
                <td className="p-3 border-b">
                  {g.active_member_count === null || g.active_member_count === undefined
                    ? "-"
                    : Number(g.active_member_count)}
                </td>
                <td className="p-3 border-b">
                  {g.total_base_points === null || g.total_base_points === undefined
                    ? "-"
                    : formatPoints(g.total_base_points)}
                </td>
                <td className="sticky right-0 z-[1] p-3 border-b bg-white group-hover:bg-gray-50 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)]">
                  <button
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => nav(`/groups/${g.group_id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-500" colSpan={8}>
                  No groups found for the current filters.
                </td>
                <td className="sticky right-0 border-b bg-white shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)]" />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
