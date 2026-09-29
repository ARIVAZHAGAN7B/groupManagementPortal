import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdaptiveNow } from "../../hooks/useAdaptiveNow";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import { fetchEvents } from "../../service/events.api";
import { fetchGroups } from "../../service/groups.api";
import { fetchHubs } from "../../service/hubs.api";
import {
  fetchAdminGroupEligibility,
  fetchAdminIndividualEligibility,
  fetchAdminStudentOverview
} from "../../service/eligibility.api";
import { fetchOnDutyRequests } from "../../service/onDuty.api";
import { fetchAllPhases } from "../../service/phase.api";
import { fetchSystemMetricsSummary } from "../../service/systemMetrics.api";
import { fetchEventGroups, fetchTeams } from "../../service/teams.api";
import {
  useGetAdminNotificationsQuery,
  useGetPhaseContextQuery,
  useGetProfileQuery
} from "../../store/api/sharedApi";
import { useAuth } from "../../utils/AuthContext";
import {
  AdminDashboardHero,
  AdminEventGroupStatsCard,
  AdminEventStatsCard,
  AdminGroupStatsCard,
  AdminHubStatsCard,
  AdminOperationalAlerts,
  AdminPhaseStatsCard,
  AdminReviewPulseSection,
  AdminStudentStatsCard,
  AdminSummaryTiles,
  AdminSystemHealthCard,
  AdminTeamStatsCard,
  computeDashboardMetrics,
  EMPTY_DATA,
  EMPTY_SOURCE_SUMMARY,
  safeArray,
  toPhaseEnd
} from "../components/dashboard";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [sourceSummary, setSourceSummary] = useState(EMPTY_SOURCE_SUMMARY);

  const profileQuery = useGetProfileQuery({ userId: user?.userId }, { skip: !user?.userId });
  const phaseQuery = useGetPhaseContextQuery(undefined, { skip: !user?.userId });
  const notificationsQuery = useGetAdminNotificationsQuery(
    { userId: user?.userId, userRole: user?.role },
    { skip: !user?.userId }
  );

  const phase = phaseQuery.data?.phase || null;
  const profile = profileQuery.data || null;
  const leadership = notificationsQuery.data?.leadership || null;
  const groupTier = notificationsQuery.data?.groupTier || null;
  const currentPhaseId = phase?.phase_id || null;
  const nowMs = useAdaptiveNow(toPhaseEnd(phase?.end_date)?.getTime());

  const loadDashboard = useCallback(
    async ({ background = false } = {}) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const sources = [
        { key: "studentOverview", label: "student overview", request: fetchAdminStudentOverview() },
        { key: "groups", label: "groups", request: fetchGroups() },
        { key: "phases", label: "phases", request: fetchAllPhases() },
        { key: "teams", label: "teams", request: fetchTeams({ team_type: "TEAM" }) },
        { key: "hubs", label: "hubs", request: fetchHubs() },
        { key: "events", label: "events", request: fetchEvents() },
        { key: "eventGroups", label: "event groups", request: fetchEventGroups() },
        {
          key: "onDutyRows",
          label: "on-duty queue",
          request: fetchOnDutyRequests({ admin_status: "PENDING" })
        },
        {
          key: "systemMetrics",
          label: "system metrics",
          request: fetchSystemMetricsSummary()
        }
      ];

      if (currentPhaseId) {
        sources.push(
          {
            key: "groupEligibility",
            label: "phase group eligibility",
            request: fetchAdminGroupEligibility(currentPhaseId)
          },
          {
            key: "studentEligibility",
            label: "phase student eligibility",
            request: fetchAdminIndividualEligibility(currentPhaseId)
          }
        );
      }

      try {
        const settled = await Promise.allSettled(sources.map((item) => item.request));
        const next = { ...EMPTY_DATA };
        const failed = [];

        settled.forEach((result, index) => {
          const source = sources[index];

          if (result.status !== "fulfilled") {
            failed.push(source.label);
            return;
          }

          if (source.key === "studentOverview") {
            next.students = safeArray(result.value?.students);
            return;
          }

          if (source.key === "systemMetrics") {
            next.systemMetrics = result.value || null;
            return;
          }

          next[source.key] = safeArray(result.value);
        });

        setData(next);
        setSourceSummary({
          failed,
          loaded: sources.length - failed.length,
          total: sources.length
        });
        setLastUpdatedAt(Date.now());
        setNotice(
          failed.length === 0
            ? ""
            : failed.length === sources.length
              ? "Dashboard insights are temporarily unavailable."
              : `Some insights may be stale: ${failed.join(", ")}.`
        );
      } finally {
        if (background) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [currentPhaseId]
  );

  useEffect(() => {
    if (!user?.userId) return;
    void loadDashboard();
  }, [loadDashboard, user?.userId]);

  const refreshAll = useCallback(() => {
    void loadDashboard({ background: true });

    if (user?.userId) {
      void phaseQuery.refetch();
      void notificationsQuery.refetch();
      void profileQuery.refetch();
    }
  }, [loadDashboard, notificationsQuery, phaseQuery, profileQuery, user?.userId]);

  const realtimeRefresh = useDebouncedCallback(refreshAll, 300);

  useRealtimeEvents(
    [
      REALTIME_EVENTS.ADMIN_NOTIFICATIONS,
      REALTIME_EVENTS.LEADERSHIP_REQUESTS,
      REALTIME_EVENTS.GROUP_TIER_REQUESTS,
      REALTIME_EVENTS.MEMBERSHIPS,
      REALTIME_EVENTS.TEAM_MEMBERSHIPS,
      REALTIME_EVENTS.PHASE,
      REALTIME_EVENTS.POINTS,
      REALTIME_EVENTS.ELIGIBILITY,
      REALTIME_EVENTS.AUDIT
    ],
    realtimeRefresh
  );

  const dashboard = useMemo(
    () =>
      computeDashboardMetrics({
        currentPhaseId,
        data,
        groupTier,
        leadership,
        nowMs,
        phase
      }),
    [currentPhaseId, data, groupTier, leadership, nowMs, phase]
  );

  const adminName = profile?.name || user?.name || "Admin";
  const notices = [
    notice,
    phaseQuery.isError ? "Current phase context could not be refreshed." : "",
    notificationsQuery.isError ? "Admin notification counts are temporarily unavailable." : ""
  ].filter(Boolean);

  if (loading && !lastUpdatedAt) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-screen-xl items-center justify-center px-4 py-8 font-[Inter] text-sm text-slate-500">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-screen-2xl space-y-5 px-3 py-5 font-[Inter] md:px-4 xl:px-6">
      <AdminDashboardHero
        adminName={adminName}
        navigate={navigate}
        nowMs={nowMs}
        phase={phase}
        profile={profile}
        refreshAll={refreshAll}
        refreshing={refreshing}
        sourceSummary={sourceSummary}
        user={user}
      />

      <AdminReviewPulseSection
        dashboard={dashboard}
        notices={notices}
        phase={phase}
        sourceSummary={sourceSummary}
      />

      <AdminSummaryTiles
        dashboard={dashboard}
        data={data}
        navigate={navigate}
        phase={phase}
        sourceSummary={sourceSummary}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminGroupStatsCard dashboard={dashboard} data={data} navigate={navigate} />
        <AdminPhaseStatsCard
          currentPhaseId={currentPhaseId}
          dashboard={dashboard}
          data={data}
          navigate={navigate}
          phase={phase}
        />
        <AdminTeamStatsCard dashboard={dashboard} data={data} navigate={navigate} />
        <AdminHubStatsCard dashboard={dashboard} data={data} navigate={navigate} />
        <AdminEventStatsCard dashboard={dashboard} data={data} navigate={navigate} />
        <AdminEventGroupStatsCard dashboard={dashboard} data={data} navigate={navigate} />
        <AdminStudentStatsCard
          currentPhaseId={currentPhaseId}
          dashboard={dashboard}
          data={data}
          navigate={navigate}
        />
        <AdminSystemHealthCard
          dashboard={dashboard}
          lastUpdatedAt={lastUpdatedAt}
          navigate={navigate}
          sourceSummary={sourceSummary}
        />
      </div>

      <AdminOperationalAlerts dashboard={dashboard} data={data} navigate={navigate} />
    </section>
  );
}
