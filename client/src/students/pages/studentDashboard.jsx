import React, { useMemo } from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import GroupOffRoundedIcon from "@mui/icons-material/GroupOffRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import StarsRoundedIcon from "@mui/icons-material/StarsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { useAdaptiveNow } from "../../hooks/useAdaptiveNow";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import { useGetDashboardSummaryQuery } from "../../store/api/sharedApi";
import StudentGroupHero from "../components/groups/StudentGroupHero";
import { useAuth } from "../../utils/AuthContext";

const formatNumber = (value) => (Number(value) || 0).toLocaleString();
const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));
const formatCountdown = (ms) => {
  if (!Number.isFinite(ms)) return "Unavailable";
  if (ms <= 0) return "Expired";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const formatRuleLabel = (rule) => {
  if (!rule) return "Rejoin rule";
  if (rule === "NEXT_WORKING_DAY_END") return "Next working day end";
  return String(rule)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const getProgressModel = (data, variant = "individual", missingLabel = "No data available") => {
  const palette =
    variant === "group"
      ? {
          barClass: "bg-emerald-600",
          accentTextClass: "text-emerald-700",
          subtleTextClass: "text-emerald-700/80"
        }
      : {
          barClass: "bg-[#004ac6]",
          accentTextClass: "text-[#004ac6]",
          subtleTextClass: "text-[#004ac6]/80"
        };

  if (!data) {
    return {
      available: false,
      hasTarget: false,
      isEligible: false,
      earned: 0,
      target: null,
      percent: 0,
      remaining: null,
      remainingLabel: missingLabel,
      ...palette,
      accentTextClass: "text-slate-400",
      subtleTextClass: "text-slate-500"
    };
  }

  const earned = Number(data?.earned_points) || 0;
  const hasTarget =
    data?.target_points !== null &&
    data?.target_points !== undefined &&
    Number.isFinite(Number(data?.target_points));
  const target = hasTarget ? Number(data.target_points) : null;
  const remaining = hasTarget ? Math.max(0, target - earned) : null;
  const percent = hasTarget && target > 0 ? clampPercent((earned / target) * 100) : 0;
  const isEligible = hasTarget ? Boolean(data?.is_eligible) : false;

  if (!hasTarget) {
    return {
      available: true,
      hasTarget: false,
      isEligible: false,
      earned,
      target: null,
      percent: 0,
      remaining: null,
      remainingLabel: "Target not set",
      ...palette,
      accentTextClass: "text-slate-500",
      subtleTextClass: "text-slate-500"
    };
  }

  if (isEligible) {
    return {
      available: true,
      hasTarget: true,
      isEligible: true,
      earned,
      target,
      percent,
      remaining: 0,
      remainingLabel: "Multiplier unlocked",
      barClass: "bg-emerald-500",
      accentTextClass: "text-emerald-600",
      subtleTextClass: "text-emerald-700"
    };
  }

  return {
    available: true,
    hasTarget: true,
    isEligible: false,
    earned,
    target,
    percent,
    remaining,
    remainingLabel: `${formatNumber(remaining)} left for multiplier`,
    ...palette
  };
};

const getOverallEligibilityStatus = (items) => {
  const trackedItems = items.filter((item) => item.available && item.hasTarget);

  if (trackedItems.length === 0) {
    return {
      label: "Not Set",
      badgeClass: "border-slate-200 bg-white text-slate-500"
    };
  }

  if (trackedItems.every((item) => item.isEligible)) {
    return {
      label: "Eligible",
      badgeClass: "border-emerald-200 bg-emerald-100 text-emerald-700"
    };
  }

  return {
    label: "In Progress",
    badgeClass: "border-[#bfd2ff] bg-[#dbe1ff] text-[#004ac6]"
  };
};

const getEligibilitySummary = (items, hasGroup) => {
  const remainingSegments = items
    .filter((item) => item.available && item.hasTarget && !item.isEligible && item.remaining > 0)
    .map((item) => {
      const label = item.variant === "group" ? "group" : "individual";
      return `${formatNumber(item.remaining)} ${label} left`;
    });

  if (remainingSegments.length > 0) {
    return hasGroup
      ? remainingSegments.join(" | ")
      : `${remainingSegments[0]} | Join a group to track team progress`;
  }

  if (items.some((item) => item.available && item.hasTarget)) {
    return "Multiplier unlocked";
  }

  return hasGroup ? "Targets pending" : "Join a group to track team progress";
};

const SurfaceCard = ({ children, className = "" }) => (
  <section
    className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.24)] ${className}`}
  >
    {children}
  </section>
);

const HeroBadge = ({ children, accent = false }) => (
  <span
    className={`inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold ${
      accent ? "text-[#1754cf]" : "text-slate-700"
    }`}
  >
    {children}
  </span>
);

const GroupMetaItem = ({ label, value, valueClassName = "text-slate-900" }) => (
  <div className="space-y-1">
    <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
      {label}
    </span>
    <span className={`block text-sm font-semibold ${valueClassName}`}>{value}</span>
  </div>
);

const QuickStatCard = ({ icon: Icon, label, value, iconClassName, className = "" }) => (
  <SurfaceCard className={`p-4 ${className}`}>
    <div className="group flex items-center gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${iconClassName}`}
      >
        <Icon sx={{ fontSize: 22 }} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </div>
        <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
      </div>
      <ChevronRightRoundedIcon className="ml-auto text-slate-300 transition-colors duration-200 group-hover:text-[#004ac6]" />
    </div>
  </SurfaceCard>
);

const EligibilityCountCard = ({ individualCount, groupCount }) => (
  <SurfaceCard className="p-4">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
        <WorkspacePremiumRoundedIcon sx={{ fontSize: 22 }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Eligibility Phases
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            <TaskAltRoundedIcon sx={{ fontSize: 14 }} />
            Individual {formatNumber(individualCount)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            <WorkspacePremiumRoundedIcon sx={{ fontSize: 14 }} />
            Group {formatNumber(groupCount)}
          </span>
        </div>
      </div>
    </div>
  </SurfaceCard>
);

const MultiplierCountCard = ({ counts }) => (
  <SurfaceCard className="p-5 md:col-span-2">
    <div className="flex items-center justify-between gap-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        Multiplier Counts
      </div>
      <div className="text-[11px] font-semibold text-slate-400">1.1x to 1.4x</div>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {["1.1", "1.2", "1.3", "1.4"].map((multiplier) => (
        <div key={multiplier} className="rounded-xl bg-slate-50 px-3 py-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {multiplier}x
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900">
            {formatNumber(counts?.[multiplier])}
          </div>
        </div>
      ))}
    </div>
  </SurfaceCard>
);

const PointMetric = ({ label, value, valueClassName = "text-slate-900" }) => (
  <div className="space-y-1">
    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</div>
    <div className={`text-lg font-bold leading-tight ${valueClassName}`}>{value}</div>
  </div>
);

const ProgressBar = ({ percent = 0, toneClass }) => (
  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
    <div
      className={`h-full rounded-full transition-all duration-500 ${toneClass}`}
      style={{ width: `${clampPercent(percent)}%` }}
    />
  </div>
);

const ProgressRow = ({ label, progress }) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between gap-3 text-xs font-bold">
      <span className="text-slate-900">{label}</span>
      <span className={progress.accentTextClass}>{clampPercent(progress.percent).toFixed(0)}%</span>
    </div>
    <ProgressBar percent={progress.percent} toneClass={progress.barClass} />
    <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
      <span>{formatNumber(progress.earned)} earned</span>
      <span>{progress.target === null ? "Target not set" : `${formatNumber(progress.target)} target`}</span>
    </div>
    <div className={`text-[11px] font-semibold ${progress.subtleTextClass}`}>{progress.remainingLabel}</div>
  </div>
);

const RejoinDeadlineCard = ({ deadlineInfo, nowMs }) => {
  const deadline = deadlineInfo?.rejoin_deadline_at ? new Date(deadlineInfo.rejoin_deadline_at) : null;
  const hasValidDeadline = deadline instanceof Date && !Number.isNaN(deadline.getTime());
  const remainingMs = hasValidDeadline ? deadline.getTime() - nowMs : NaN;
  const expired =
    Boolean(deadlineInfo?.is_expired) || (hasValidDeadline ? remainingMs <= 0 : false);

  if (!deadlineInfo?.has_rejoin_deadline) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-900">Not in group</span>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Open
          </span>
        </div>
        <div className="mt-3 text-sm font-semibold text-slate-900">Join available now</div>
        <div className="mt-1 text-[11px] text-slate-500">No active rejoin deadline</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-900">Not in group</span>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
            deadlineInfo?.self_join_rule_enforced
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          {deadlineInfo?.self_join_rule_enforced ? "Enforced" : "Not Enforced"}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className={`text-lg font-bold ${expired ? "text-rose-700" : "text-amber-700"}`}>
            {expired ? "Expired" : formatCountdown(remainingMs)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {hasValidDeadline ? `Join by ${deadline.toLocaleString()}` : "Join deadline unavailable"}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
          Rule: {formatRuleLabel(deadlineInfo?.rule)}
        </span>
        {expired ? (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
            Admin approval required
          </span>
        ) : null}
      </div>
    </div>
  );
};

const EmptyGroupCard = () => (
  <SurfaceCard className="p-6">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <GroupOffRoundedIcon sx={{ fontSize: 26 }} />
      </div>
      <div className="space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Group</div>
        <h2 className="text-lg font-bold text-slate-900">No group joined</h2>
        <p className="text-sm text-slate-500">Join a group to unlock group progress.</p>
      </div>
    </div>
  </SurfaceCard>
);

const LoadingDashboard = () => (
  <div className="space-y-6">
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-3 w-32 rounded bg-slate-200" />
        <div className="h-10 w-72 rounded bg-slate-200" />
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-32 rounded-full bg-slate-200" />
          <div className="h-8 w-28 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200 md:col-span-2" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200 md:col-span-2" />
        </div>
      </div>
      <div className="h-[26rem] animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />
    </div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const {
    data: summary,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetDashboardSummaryQuery(undefined, {
    skip: !user
  });
  const rejoinTargetTimeMs = useMemo(() => {
    if (summary?.group || !summary?.rejoin_deadline?.has_rejoin_deadline) return NaN;
    return Date.parse(summary.rejoin_deadline.rejoin_deadline_at);
  }, [summary]);
  const nowMs = useAdaptiveNow(rejoinTargetTimeMs);
  const summaryError =
    error?.message ||
    error?.data?.message ||
    error?.data?.error ||
    "";
  const handleRealtimeRefresh = useDebouncedCallback(() => {
    void refetch();
  }, 300);

  useRealtimeEvents(
    [
      REALTIME_EVENTS.PHASE,
      REALTIME_EVENTS.MEMBERSHIPS,
      REALTIME_EVENTS.TEAM_MEMBERSHIPS,
      REALTIME_EVENTS.POINTS,
      REALTIME_EVENTS.ELIGIBILITY
    ],
    handleRealtimeRefresh
  );

  const displayName = summary?.name || user?.name || "Student";
  const group = summary?.group || null;
  const phaseLabel =
    summary?.this_phase_eligibility?.phase_name ||
    summary?.this_phase_eligibility?.phase_id ||
    "No active phase";
  const initialLoading = isLoading && !summary;
  const heroStatusLabel = group ? "Active" : "No Group";

  const individualProgress = useMemo(
    () => ({
      ...getProgressModel(summary?.this_phase_eligibility?.individual, "individual"),
      variant: "individual"
    }),
    [summary]
  );

  const groupProgress = useMemo(
    () => ({
      ...getProgressModel(
        summary?.this_phase_eligibility?.group,
        "group",
        group ? "Group progress unavailable" : "Join a group to track team progress"
      ),
      variant: "group"
    }),
    [group, summary]
  );

  const eligibilityStatus = useMemo(
    () => getOverallEligibilityStatus([individualProgress, groupProgress]),
    [groupProgress, individualProgress]
  );

  const eligibilitySummary = useMemo(
    () => getEligibilitySummary([individualProgress, groupProgress], Boolean(group)),
    [group, groupProgress, individualProgress]
  );

  const heroActions = (
    <button
      type="button"
      onClick={() => void refetch()}
      disabled={isFetching}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
    >
      <RefreshRoundedIcon sx={{ fontSize: 18 }} />
      {isFetching ? "Refreshing..." : "Refresh"}
    </button>
  );

  const heroBadges = (
    <>
      <HeroBadge accent>{summary?.student_id || "Student ID unavailable"}</HeroBadge>
      <HeroBadge>{heroStatusLabel}</HeroBadge>
      <HeroBadge>{phaseLabel}</HeroBadge>
    </>
  );

  return (
    <main className="max-w-screen-2xl space-y-4 p-4 font-[Inter] text-slate-900 md:p-6">
      {summaryError ? (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />
          <span>{summaryError}</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="ml-auto text-[11px] font-bold uppercase tracking-[0.12em] text-rose-700 transition-opacity hover:opacity-70"
          >
            Retry
          </button>
        </div>
      ) : null}

      <StudentGroupHero
        actions={heroActions}
        badges={heroBadges}
        eyebrow="Student Workspace"
        title={`Welcome back, ${displayName}`}
      />

      {initialLoading ? (
        <LoadingDashboard />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            {group ? (
              <SurfaceCard className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dbe1ff] text-[#004ac6]">
                      <GroupRoundedIcon sx={{ fontSize: 22 }} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {group.group_name || "Unnamed group"}
                      </h2>
                      {group.group_code ? (
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          {group.group_code}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Group
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <GroupMetaItem label="ID" value={group.group_id ? String(group.group_id) : "-"} />
                  <GroupMetaItem
                    label="Tier"
                    value={group.tier ? `Tier ${group.tier}` : "-"}
                  />
                  <GroupMetaItem
                    label="Members"
                    value={formatNumber(group.member_count)}
                  />
                  <GroupMetaItem
                    label="Role"
                    value={group.role || "-"}
                    valueClassName="text-[#004ac6]"
                  />
                </div>
              </SurfaceCard>
            ) : (
              <EmptyGroupCard />
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <QuickStatCard
                icon={GroupsRoundedIcon}
                label="Teams"
                value={formatNumber(summary?.stats?.active_team_count)}
                iconClassName="bg-[#dbe1ff] text-[#004ac6]"
              />
              <QuickStatCard
                icon={HubRoundedIcon}
                label="Hubs"
                value={formatNumber(summary?.stats?.active_hub_count)}
                iconClassName="bg-slate-100 text-slate-700"
              />
              <QuickStatCard
                icon={EventAvailableRoundedIcon}
                label="Event Groups"
                value={formatNumber(summary?.stats?.active_event_team_count)}
                iconClassName="bg-emerald-100 text-emerald-700"
              />
              <EligibilityCountCard
                individualCount={summary?.stats?.individual_eligible_phase_count}
                groupCount={summary?.stats?.active_group_eligible_phase_count}
              />
              <MultiplierCountCard counts={summary?.multiplier_counts} />

              <SurfaceCard className="p-5 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Individual Stats
                  </div>
                  <div className="text-xs font-semibold text-[#004ac6]">
                    {formatNumber(summary?.this_phase_base_points)} this phase
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                  <PointMetric label="Base Points" value={formatNumber(summary?.base_points)} />
                  <PointMetric
                    label="Bonus Points"
                    value={formatNumber(summary?.eligibility_points)}
                    valueClassName="text-[#004ac6]"
                  />
                  <PointMetric label="Total" value={formatNumber(summary?.total_points)} />
                  <PointMetric
                    label="This Phase"
                    value={formatNumber(summary?.this_phase_base_points)}
                    valueClassName="text-emerald-700"
                  />
                </div>
              </SurfaceCard>
            </div>
          </div>

          <SurfaceCard className="border-slate-200/70 bg-slate-50/70 p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Eligibility
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${eligibilityStatus.badgeClass}`}
              >
                {eligibilityStatus.label}
              </span>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-bold text-slate-900">Active Phase</h3>
              <p className="mt-1 text-sm text-slate-500">{phaseLabel}</p>
            </div>

            <div className="mt-6 space-y-6">
              <ProgressRow label="Individual Progress" progress={individualProgress} />
              {group ? (
                <ProgressRow label="Group Progress" progress={groupProgress} />
              ) : (
                <RejoinDeadlineCard deadlineInfo={summary?.rejoin_deadline} nowMs={nowMs} />
              )}
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">
              <StarsRoundedIcon sx={{ fontSize: 18 }} />
              <p className="text-xs font-semibold leading-5">{eligibilitySummary}</p>
            </div>
          </SurfaceCard>
        </div>
      )}
    </main>
  );
};

export default StudentDashboard;
