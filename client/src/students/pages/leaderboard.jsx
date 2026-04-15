import { useCallback, useEffect, useMemo, useState } from "react";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import { fetchStudentLeaderboards } from "../../service/eligibility.api";
import { fetchAllPhases } from "../../service/phase.api";
import LeaderboardGroupCards from "../components/leaderboard/LeaderboardGroupCards";
import LeaderboardGroupTable from "../components/leaderboard/LeaderboardGroupTable";
import LeaderboardStudentCards from "../components/leaderboard/LeaderboardStudentCards";
import LeaderboardStudentTable from "../components/leaderboard/LeaderboardStudentTable";
import {
  LeaderboardEmptyState,
  LeaderboardPanel
} from "../components/leaderboard/LeaderboardShared";
import LeaderboardTabs from "../components/leaderboard/LeaderboardTabs";
import {
  getPhaseOptionLabel,
  TIER_OPTIONS
} from "../components/leaderboard/leaderboard.constants";
import { WorkspaceFilterBar } from "../../shared/components/WorkspaceInlineFilters";
import WorkspacePageHeader, {
  WorkspacePageHeaderActionButton
} from "../../shared/components/WorkspacePageHeader";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

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
  const filterFields = useMemo(
    () => [
      {
        key: "phase",
        type: "select",
        label: "Phase",
        value: selectedPhaseId,
        onChangeValue: setSelectedPhaseId,
        wrapperClassName: "w-full xl:min-w-[20rem] xl:max-w-[28rem] xl:flex-1",
        options: [
          { value: "", label: "All Time" },
          ...phases.map((phase) => ({
            value: phase.phase_id,
            label: getPhaseOptionLabel(phase)
          }))
        ]
      },
      {
        key: "tier",
        type: "select",
        label: "Tier",
        value: selectedTier,
        onChangeValue: (value) => setSelectedTier(String(value || "").toUpperCase()),
        wrapperClassName: "w-full sm:w-[170px]",
        options: [
          { value: "", label: "All Tiers" },
          ...TIER_OPTIONS.map((tier) => ({
            value: tier,
            label: `Tier ${tier}`
          }))
        ]
      }
    ],
    [phases, selectedPhaseId, selectedTier]
  );
  const emptyMessage =
    activeTab === "groups"
      ? "No group leaderboard data is available for the selected filters."
      : "No student leaderboard data is available for the selected filters.";

  return (
    <div className="max-w-screen-2xl space-y-4 p-4 md:p-6">
      <WorkspacePageHeader
        eyebrow="Student Workspace"
        title="Leaderboard"
        description="Compare individual, leader, and group rankings through a simpler view of points, tiers, and current placement."
        actions={
          <WorkspacePageHeaderActionButton
            type="button"
            onClick={() => {
              void load({ phaseId: selectedPhaseId, tier: selectedTier });
            }}
            disabled={loading}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            {loading ? "Refreshing..." : "Refresh"}
          </WorkspacePageHeaderActionButton>
        }
      />

      <WorkspaceFilterBar
        fields={filterFields}
        onReset={() => {
          setSelectedPhaseId("");
          setSelectedTier("");
        }}
        hasActiveFilters={hasActiveFilters}
      />

      {phaseLoadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {phaseLoadError}
        </div>
      ) : null}

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
