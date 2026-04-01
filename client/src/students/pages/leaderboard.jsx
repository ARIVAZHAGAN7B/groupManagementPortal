import { useCallback, useEffect, useMemo, useState } from "react";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import { fetchStudentLeaderboards } from "../../service/eligibility.api";
import { fetchAllPhases } from "../../service/phase.api";
import LeaderboardFilters from "../components/leaderboard/LeaderboardFilters";
import LeaderboardGroupCards from "../components/leaderboard/LeaderboardGroupCards";
import LeaderboardGroupTable from "../components/leaderboard/LeaderboardGroupTable";
import LeaderboardStudentCards from "../components/leaderboard/LeaderboardStudentCards";
import LeaderboardStudentTable from "../components/leaderboard/LeaderboardStudentTable";
import {
  LeaderboardEmptyState,
  LeaderboardPanel
} from "../components/leaderboard/LeaderboardShared";
import LeaderboardTabs from "../components/leaderboard/LeaderboardTabs";

const createEmptyData = ({ phaseId = null, tier = null, pointsScope = "TOTAL" } = {}) => ({
  limit: 30,
  filters: {
    phase_id: phaseId,
    tier
  },
  points_scope: pointsScope,
  phase: null,
  individual: [],
  leaders: [],
  groups: []
});

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("individual");
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [phases, setPhases] = useState([]);
  const [phaseLoadError, setPhaseLoadError] = useState("");
  const [data, setData] = useState(createEmptyData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (overrides = {}) => {
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
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Failed to load leaderboards");
        setData(
          createEmptyData({
            phaseId: phaseId || null,
            tier: tier || null,
            pointsScope: phaseId ? "PHASE" : "TOTAL"
          })
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedPhaseId, selectedTier]
  );

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const rows = await fetchAllPhases();
        if (!active) return;
        setPhases(Array.isArray(rows) ? rows : []);
        setPhaseLoadError("");
      } catch (phaseError) {
        if (!active) return;
        setPhases([]);
        setPhaseLoadError(phaseError?.response?.data?.error || "Failed to load phases");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    load({ phaseId: selectedPhaseId, tier: selectedTier });
  }, [load, selectedPhaseId, selectedTier]);

  useRealtimeEvents(
    [REALTIME_EVENTS.POINTS, REALTIME_EVENTS.ELIGIBILITY, REALTIME_EVENTS.PHASE],
    () => {
      void load({ phaseId: selectedPhaseId, tier: selectedTier });
    }
  );

  const activeRows = useMemo(() => data[activeTab] || [], [activeTab, data]);
  const pointsColumnLabel =
    data.points_scope === "PHASE" ? "Phase Base Points" : "Total Base Points";
  const hasActiveFilters = Boolean(selectedPhaseId || selectedTier);
  const counts = useMemo(
    () => ({
      individual: data.individual.length,
      leaders: data.leaders.length,
      groups: data.groups.length
    }),
    [data.groups.length, data.individual.length, data.leaders.length]
  );
  const emptyMessage =
    activeTab === "groups"
      ? "No group leaderboard data is available for the selected filters."
      : "No student leaderboard data is available for the selected filters.";

  return (
    <div className="max-w-screen-2xl space-y-4 p-4 md:p-6">
      <LeaderboardFilters
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          setSelectedPhaseId("");
          setSelectedTier("");
        }}
        onPhaseChange={(event) => setSelectedPhaseId(event.target.value)}
        onTierChange={(event) =>
          setSelectedTier(String(event.target.value || "").toUpperCase())
        }
        phaseLoadError={phaseLoadError}
        phases={phases}
        selectedPhaseId={selectedPhaseId}
        selectedTier={selectedTier}
      />

      <LeaderboardTabs activeTab={activeTab} counts={counts} onChange={setActiveTab} />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <LeaderboardPanel>
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Loading leaderboard...
          </div>
        </LeaderboardPanel>
      ) : activeRows.length === 0 ? (
        <LeaderboardEmptyState message={emptyMessage} />
      ) : activeTab === "groups" ? (
        <>
          <LeaderboardGroupCards pointsColumnLabel={pointsColumnLabel} rows={activeRows} />
          <LeaderboardGroupTable pointsColumnLabel={pointsColumnLabel} rows={activeRows} />
        </>
      ) : (
        <>
          <LeaderboardStudentCards pointsColumnLabel={pointsColumnLabel} rows={activeRows} />
          <LeaderboardStudentTable pointsColumnLabel={pointsColumnLabel} rows={activeRows} />
        </>
      )}
    </div>
  );
}
