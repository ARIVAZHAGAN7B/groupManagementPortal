import {
  buildCountMap,
  buildStatusCounts,
  count,
  getDaysUntil,
  getGrowthWindowCounts,
  isCompletedEvent,
  isRegistrationClosed,
  isRegistrationOpen,
  isRegistrationUpcoming,
  isTrue,
  isUpcomingEvent,
  num,
  phaseProgress,
  safeArray,
  toSortedEntries,
  upper
} from "./adminDashboard.constants";

export function computeDashboardMetrics({
  data,
  phase,
  currentPhaseId,
  groupTier,
  leadership,
  nowMs
}) {
  const groups = safeArray(data?.groups);
  const phases = safeArray(data?.phases);
  const teams = safeArray(data?.teams);
  const hubs = safeArray(data?.hubs);
  const events = safeArray(data?.events);
  const eventGroups = safeArray(data?.eventGroups);
  const students = safeArray(data?.students);
  const groupEligibility = safeArray(data?.groupEligibility);
  const studentEligibility = safeArray(data?.studentEligibility);
  const onDutyRows = safeArray(data?.onDutyRows);
  const systemMetrics = data?.systemMetrics || null;

  const groupStatusCounts = buildStatusCounts(groups, (row) => row?.status, [
    "ACTIVE",
    "INACTIVE",
    "FROZEN",
    "ARCHIVED"
  ]);
  const phaseStatusCounts = buildStatusCounts(phases, (row) => row?.status, [
    "ACTIVE",
    "INACTIVE"
  ]);
  const teamStatusCounts = buildStatusCounts(teams, (row) => row?.status, [
    "ACTIVE",
    "INACTIVE",
    "FROZEN",
    "ARCHIVED"
  ]);
  const hubStatusCounts = buildStatusCounts(hubs, (row) => row?.status, [
    "ACTIVE",
    "INACTIVE",
    "FROZEN",
    "ARCHIVED"
  ]);
  const eventStatusCounts = buildStatusCounts(events, (row) => row?.status, [
    "ACTIVE",
    "CLOSED",
    "INACTIVE",
    "ARCHIVED"
  ]);
  const eventGroupStatusCounts = buildStatusCounts(eventGroups, (row) => row?.status, [
    "ACTIVE",
    "INACTIVE",
    "FROZEN",
    "ARCHIVED"
  ]);
  const studentStatusCounts = buildStatusCounts(
    students,
    (row) => row?.student_status || row?.status,
    ["ACTIVE", "INACTIVE"]
  );

  const groupedStudents = students.filter((row) => Boolean(row?.group_id)).length;
  const ungroupedStudents = Math.max(students.length - groupedStudents, 0);
  const eligibleStudents = studentEligibility.filter((row) => isTrue(row?.is_eligible)).length;
  const ineligibleStudents = studentEligibility.filter((row) => !isTrue(row?.is_eligible)).length;
  const eligibleGroups = groupEligibility.filter((row) => isTrue(row?.is_eligible)).length;
  const ineligibleGroups = groupEligibility.filter((row) => !isTrue(row?.is_eligible)).length;

  const tierDistribution = ["A", "B", "C", "D"].map((tier) => ({
    label: `Tier ${tier}`,
    value: groups.filter((row) => upper(row?.tier) === tier).length
  }));
  const eventCategoryDistribution = toSortedEntries(
    buildCountMap(events, (row) => row?.event_category, "Uncategorized")
  ).slice(0, 6);

  const studentGrowth = getGrowthWindowCounts(
    students,
    (row) => row?.student_created_at,
    nowMs
  );
  const groupGrowth = getGrowthWindowCounts(groups, (row) => row?.created_at, nowMs);
  const teamGrowth = getGrowthWindowCounts(teams, (row) => row?.created_at, nowMs);
  const eventGrowth = getGrowthWindowCounts(events, (row) => row?.created_at, nowMs);
  const hubGrowth = getGrowthWindowCounts(hubs, (row) => row?.created_at, nowMs);

  const avgStudentsPerActiveGroup =
    groupStatusCounts.ACTIVE > 0 ? groupedStudents / groupStatusCounts.ACTIVE : null;
  const avgMembersPerTeam =
    teams.length > 0
      ? teams.reduce((sum, row) => sum + num(row?.active_member_count), 0) / teams.length
      : null;
  const avgMembersPerHub =
    hubs.length > 0
      ? hubs.reduce((sum, row) => sum + num(row?.active_member_count), 0) / hubs.length
      : null;

  const openEvents = events.filter((row) => isRegistrationOpen(row, nowMs));
  const closedEvents = events.filter((row) => isRegistrationClosed(row, nowMs));
  const registrationUpcomingEvents = events.filter((row) => isRegistrationUpcoming(row, nowMs));
  const upcomingEvents = events.filter((row) => isUpcomingEvent(row, nowMs));
  const completedEvents = events.filter((row) => isCompletedEvent(row, nowMs));
  const cappedEvents = events.filter((row) => num(row?.maximum_count) > 0);
  const totalEventCapacity = cappedEvents.reduce((sum, row) => sum + num(row?.maximum_count), 0);
  const totalEventRegistrations = cappedEvents.reduce((sum, row) => sum + num(row?.applied_count), 0);
  const participationRate =
    totalEventCapacity > 0 ? totalEventRegistrations / totalEventCapacity : null;

  const nearDeadlineEvents = openEvents
    .map((row) => ({
      ...row,
      daysLeft: getDaysUntil(row?.registration_end_date, nowMs)
    }))
    .filter((row) => row.daysLeft !== null && row.daysLeft >= 0 && row.daysLeft <= 3)
    .sort(
      (left, right) =>
        left.daysLeft - right.daysLeft ||
        String(left?.event_name || "").localeCompare(String(right?.event_name || ""))
    );

  const lowParticipationEvents = events
    .map((row) => ({
      ...row,
      usage:
        num(row?.maximum_count) > 0 ? num(row?.applied_count) / num(row?.maximum_count) : null
    }))
    .filter(
      (row) =>
        upper(row?.status) === "ACTIVE" &&
        row.usage !== null &&
        row.usage < 0.25 &&
        num(row?.maximum_count) > 0
    )
    .sort(
      (left, right) =>
        left.usage - right.usage ||
        String(left?.event_name || "").localeCompare(String(right?.event_name || ""))
    );

  const eventGroupMap = eventGroups.reduce((accumulator, row) => {
    const eventId = Number(row?.event_id);
    const key = Number.isInteger(eventId) && eventId > 0 ? eventId : `unknown-${row?.team_id}`;
    if (!accumulator.has(key)) {
      accumulator.set(key, {
        count: 0,
        eventId: Number.isInteger(eventId) && eventId > 0 ? eventId : null,
        eventName: row?.event_name || row?.event_code || "Unassigned event",
        members: 0
      });
    }

    const item = accumulator.get(key);
    item.count += 1;
    item.members += num(row?.active_member_count);
    return accumulator;
  }, new Map());

  const groupsPerEvent = Array.from(eventGroupMap.values())
    .sort((left, right) => right.count - left.count || right.members - left.members)
    .slice(0, 5);

  const topGroupsByActivity = [...groups]
    .sort(
      (left, right) =>
        num(right?.lifetime_total_points) - num(left?.lifetime_total_points) ||
        num(right?.active_member_count) - num(left?.active_member_count)
    )
    .slice(0, 5);

  const topTeamsByMembers = [...teams]
    .sort(
      (left, right) =>
        num(right?.active_member_count) - num(left?.active_member_count) ||
        String(left?.team_name || "").localeCompare(String(right?.team_name || ""))
    )
    .slice(0, 5);

  const topEventGroupsByProgress = [...eventGroups]
    .sort(
      (left, right) =>
        num(right?.rounds_cleared) - num(left?.rounds_cleared) ||
        num(right?.active_member_count) - num(left?.active_member_count)
    )
    .slice(0, 5);

  const largestGroupsByMembers = [...groups]
    .sort(
      (left, right) =>
        num(right?.active_member_count) - num(left?.active_member_count) ||
        String(left?.group_name || "").localeCompare(String(right?.group_name || ""))
    )
    .slice(0, 5);

  const progressedEventGroups = eventGroups.filter((row) => num(row?.rounds_cleared) > 0).length;
  const groupsWithMembers = groups.filter((row) => num(row?.active_member_count) > 0).length;
  const populatedTeams = teams.filter((row) => num(row?.active_member_count) > 0).length;
  const pendingLeadership = num(leadership?.pending_request_count);
  const leadershipGapCount = num(
    leadership?.groups_with_missing_leadership_count ??
      leadership?.groups_without_leadership_count
  );
  const pendingTier = num(groupTier?.pending_request_count);
  const pendingOd = onDutyRows.length;

  const frozenEntities =
    num(groupStatusCounts.FROZEN) +
    num(teamStatusCounts.FROZEN) +
    num(hubStatusCounts.FROZEN) +
    num(eventGroupStatusCounts.FROZEN);
  const inactiveEntities =
    num(groupStatusCounts.INACTIVE) +
    num(teamStatusCounts.INACTIVE) +
    num(hubStatusCounts.INACTIVE) +
    num(eventStatusCounts.INACTIVE) +
    num(eventGroupStatusCounts.INACTIVE);

  return {
    alerts: [
      {
        badge: count(leadershipGapCount),
        badgeTone: "bg-amber-600",
        count: leadershipGapCount,
        meta: "Groups currently missing required leadership roles.",
        route: "/leadership-management",
        title: "Leadership gaps"
      },
      {
        badge: count(pendingLeadership),
        badgeTone: "bg-rose-600",
        count: pendingLeadership,
        meta: "Leadership requests waiting for admin review.",
        route: "/leadership-management",
        title: "Pending leadership requests"
      },
      {
        badge: count(pendingTier),
        badgeTone: "bg-sky-600",
        count: pendingTier,
        meta: "Tier change requests still in the approval queue.",
        route: "/tier-management",
        title: "Pending tier requests"
      },
      {
        badge: count(pendingOd),
        badgeTone: "bg-indigo-600",
        count: pendingOd,
        meta: "On-duty requests requiring admin action.",
        route: "/on-duty-management",
        title: "On-duty review queue"
      },
      {
        badge: count(ungroupedStudents),
        badgeTone: "bg-slate-900",
        count: ungroupedStudents,
        meta: "Students not assigned to any active group.",
        route: "/student-management",
        title: "Ungrouped students"
      },
      {
        badge: count(frozenEntities),
        badgeTone: "bg-amber-500",
        count: frozenEntities,
        meta: "Frozen groups, teams, hubs, or event groups needing attention.",
        route: "/groups",
        title: "Frozen entities"
      },
      {
        badge: count(inactiveEntities),
        badgeTone: "bg-slate-700",
        count: inactiveEntities,
        meta: "Inactive entities across the active service catalog.",
        route: "/groups",
        title: "Inactive entities"
      },
      {
        badge: count(nearDeadlineEvents.length),
        badgeTone: "bg-orange-600",
        count: nearDeadlineEvents.length,
        meta: "Events with registration closing within the next 3 days.",
        route: "/event-management",
        title: "Registration deadlines"
      },
      {
        badge: count(lowParticipationEvents.length),
        badgeTone: "bg-rose-600",
        count: lowParticipationEvents.length,
        meta: "Open events below 25% of configured registration capacity.",
        route: "/event-management",
        title: "Low participation warnings"
      }
    ].filter((item) => item.count > 0),
    avgEventGroupsPerEvent: events.length > 0 ? eventGroups.length / events.length : null,
    avgMembersPerHub,
    avgMembersPerTeam,
    avgStudentsPerActiveGroup,
    closedEvents,
    completedEvents,
    eligibleGroups,
    eligibleStudents,
    eventCategoryDistribution,
    eventGroupStatusCounts,
    eventGrowth,
    eventStatusCounts,
    frozenEntities,
    groupEligibilityLabel: currentPhaseId
      ? `${count(eligibleGroups)} eligible | ${count(ineligibleGroups)} ineligible`
      : "No active phase snapshot",
    groupGrowth,
    groupStatusCounts,
    groupTierDistribution: tierDistribution,
    groups,
    groupsPerEvent,
    groupsWithMembers,
    groupedStudents,
    hubGrowth,
    hubStatusCounts,
    inactiveEntities,
    ineligibleGroups,
    ineligibleStudents,
    largestGroupsByMembers,
    leadershipGapCount,
    lowParticipationEvents,
    nearDeadlineEvents,
    openEvents,
    participationRate,
    pendingLeadership,
    pendingOd,
    pendingTier,
    phaseProgressValue: phaseProgress(phase, nowMs),
    phaseStatusCounts,
    populatedTeams,
    progressedEventGroups,
    registrationUpcomingEvents,
    studentEligibilityLabel: currentPhaseId
      ? `${count(eligibleStudents)} eligible | ${count(ineligibleStudents)} ineligible`
      : "No active phase snapshot",
    studentGrowth,
    studentStatusCounts,
    systemMetrics,
    teamGrowth,
    teamStatusCounts,
    topEventGroupsByProgress,
    topGroupsByActivity,
    topTeamsByMembers,
    totalEventCapacity,
    totalEventRegistrations,
    upcomingEvents,
    ungroupedStudents
  };
}
