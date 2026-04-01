const repo = require("./membership.repository");
const db = require("../../config/db");
const phaseRepo = require("../phase/phase.repository");
const systemConfigService = require("../systemConfig/systemConfig.service");
const { buildPaginatedResponse, parsePaginationQuery } = require("../../utils/pagination");

const REJOIN_DEADLINE_HOURS = 24;
const REJOIN_DEADLINE_RULE = "NEXT_WORKING_DAY_END";
const GROUP_RANK_REVIEW_INTERVAL = 5;
const MIN_GROUP_PHASES_FOR_RANK_DETAILS = GROUP_RANK_REVIEW_INTERVAL;
const LIMITED_MEMBER_RANKS = Object.freeze([1, 2, 3, 4]);
const MEMBER_RANK_LIMIT = 2;
const VALID_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER", "MEMBER"];
const LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];
const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];
const MEMBER_RANK_RULES = Object.freeze([
  {
    rank: 1,
    label: "Rank 1",
    criteria: "Top 2 review scores",
    summary: "Best overall score in the latest 5-phase review cycle"
  },
  {
    rank: 2,
    label: "Rank 2",
    criteria: "Next 2 review scores",
    summary: "Strong review score in the latest 5-phase review cycle"
  },
  {
    rank: 3,
    label: "Rank 3",
    criteria: "Next 2 review scores",
    summary: "Solid review score in the latest 5-phase review cycle"
  },
  {
    rank: 4,
    label: "Rank 4",
    criteria: "Next 2 review scores",
    summary: "Eligible for promotion zone in the latest 5-phase review cycle"
  },
  {
    rank: 5,
    label: "Rank 5",
    criteria: "Remaining members",
    summary: "Default rank until the next 5-phase review cycle"
  }
]);
const DEFAULT_GROUP_RANK_RULES = Object.freeze({
  LOYALTY: {
    rule_code: "LOYALTY",
    rule_name: "Loyalty",
    rank_4_min_value: 8,
    rank_3_min_value: 12,
    rank_2_min_value: 16,
    rank_1_min_value: 20,
    score_weight: 1
  },
  CONTRIBUTION: {
    rule_code: "CONTRIBUTION",
    rule_name: "Contribution",
    rank_4_min_value: 5000,
    rank_3_min_value: 8000,
    rank_2_min_value: 12000,
    rank_1_min_value: 16000,
    score_weight: 1
  },
  RELIABILITY: {
    rule_code: "RELIABILITY",
    rule_name: "Reliability",
    rank_4_min_value: 5,
    rank_3_min_value: 10,
    rank_2_min_value: 20,
    rank_1_min_value: 30,
    score_weight: 1
  }
});
const CRITERION_SCORE_CAPS = Object.freeze({
  LOYALTY: 30,
  CONTRIBUTION: 40,
  RELIABILITY: 30
});

let syncPendingGroupRankReviewsPromise = null;

const pad2 = (value) => String(value).padStart(2, "0");

const toDateOnly = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const normalizeTimeText = (value, fallback = "00:00:00") => {
  const raw = String(value || fallback).trim();
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
  if (!match) return fallback;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return fallback;
  }

  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};

const buildDateTimeText = (dateValue, timeValue, fallbackTime = "00:00:00") => {
  const dateOnly = toDateOnly(dateValue);
  if (!dateOnly) return null;
  return `${dateOnly} ${normalizeTimeText(timeValue, fallbackTime)}`;
};

const toSqlDateTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${toDateOnly(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const parseDateForSort = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getTime();
};

const formatDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US");
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const nextWorkingDayDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const cursor = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (isWeekend(cursor)) {
    cursor.setDate(cursor.getDate() + 1);
  }

  return cursor;
};

const endOfLocalDay = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
};

const normalizeIntegerMetric = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) return 0;
  return Math.floor(normalized);
};

const normalizeScoreWeight = (value, fallback = 1) => {
  const weight = Number(value);
  if (!Number.isFinite(weight) || weight <= 0) return fallback;
  return weight;
};

const roundScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100) / 100;
};

const normalizeManualRank = (value) => {
  const rank = Number(value);
  return Number.isInteger(rank) && rank >= 1 && rank <= 5 ? rank : null;
};

const normalizeOptionalPositiveInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return parsed;
};

const normalizeOptionalMembershipStatus = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = String(value).trim().toUpperCase();
  if (!["ACTIVE", "LEFT"].includes(normalized)) {
    throw new Error("status must be ACTIVE or LEFT");
  }
  return normalized;
};

const normalizeOptionalMembershipRole = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = String(value).trim().toUpperCase();
  if (!VALID_ROLES.includes(normalized)) {
    throw new Error(`role must be one of: ${VALID_ROLES.join(", ")}`);
  }
  return normalized;
};

const resolveGroupStatusByCount = (count, policy) => {
  const min = Number(policy.min_group_members) || 9;
  const max = Number(policy.max_group_members) || 11;
  return count >= min && count <= max ? "ACTIVE" : "INACTIVE";
};

const getRejoinDeadlineFromLeaveDate = (leaveDate) => {
  const nextWorkingDay = nextWorkingDayDate(leaveDate);
  if (!nextWorkingDay) return null;
  return endOfLocalDay(nextWorkingDay);
};

const getRankRuleEntry = (rank) =>
  MEMBER_RANK_RULES.find((entry) => entry.rank === rank) ||
  MEMBER_RANK_RULES[MEMBER_RANK_RULES.length - 1];

const mergeRankRules = async (executor) => {
  const configuredRows = await repo.getGroupRankRules(executor);
  const merged = {};

  Object.entries(DEFAULT_GROUP_RANK_RULES).forEach(([ruleCode, rule]) => {
    merged[ruleCode] = {
      ...rule,
      score_weight: normalizeScoreWeight(rule.score_weight, 1)
    };
  });

  for (const row of Array.isArray(configuredRows) ? configuredRows : []) {
    const ruleCode = String(row?.rule_code || "").toUpperCase();
    if (!ruleCode) continue;
    const fallback = merged[ruleCode] || DEFAULT_GROUP_RANK_RULES[ruleCode] || {};
    merged[ruleCode] = {
      ...fallback,
      ...row,
      rule_code: ruleCode,
      score_weight: normalizeScoreWeight(row?.score_weight, normalizeScoreWeight(fallback.score_weight, 1))
    };
  }

  return merged;
};

const getResolvedGroupRankRuleConfig = async (groupId, executor) => {
  const systemRules = await mergeRankRules(executor);
  const overrideRows =
    groupId === null || groupId === undefined
      ? []
      : await repo.getGroupRankRuleOverrides(groupId, executor);

  const effectiveRules = { ...systemRules };
  const overridesByCode = {};
  let latestUpdatedAt = null;

  for (const row of Array.isArray(overrideRows) ? overrideRows : []) {
    const ruleCode = String(row?.rule_code || "").toUpperCase();
    if (!ruleCode || !effectiveRules[ruleCode]) continue;

    const mergedRule = {
      ...effectiveRules[ruleCode],
      ...row,
      rule_code: ruleCode,
      score_weight: normalizeScoreWeight(
        row?.score_weight,
        normalizeScoreWeight(effectiveRules[ruleCode]?.score_weight, 1)
      )
    };

    effectiveRules[ruleCode] = mergedRule;
    overridesByCode[ruleCode] = mergedRule;

    const updatedAtTime = parseDateForSort(row?.updated_at);
    if (updatedAtTime !== null && (latestUpdatedAt === null || updatedAtTime > latestUpdatedAt)) {
      latestUpdatedAt = updatedAtTime;
    }
  }

  return {
    systemRules,
    effectiveRules,
    overridesByCode,
    hasGroupOverride: overrideRows.length > 0,
    groupOverrideUpdatedAt:
      latestUpdatedAt === null ? null : new Date(latestUpdatedAt).toISOString()
  };
};

const validateThresholdValue = (value, label) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return normalized;
};

const normalizeGroupRankRulePayload = (rules = {}, fallbackRules = {}) => {
  const normalized = {};

  for (const ruleCode of Object.keys(DEFAULT_GROUP_RANK_RULES)) {
    const fallback = fallbackRules[ruleCode] || DEFAULT_GROUP_RANK_RULES[ruleCode];
    const incoming = rules?.[ruleCode];

    if (!incoming) {
      normalized[ruleCode] = {
        rule_code: ruleCode,
        rank_4_min_value: validateThresholdValue(
          fallback.rank_4_min_value,
          `${ruleCode} rank 4 minimum`
        ),
        rank_3_min_value: validateThresholdValue(
          fallback.rank_3_min_value,
          `${ruleCode} rank 3 minimum`
        ),
        rank_2_min_value: validateThresholdValue(
          fallback.rank_2_min_value,
          `${ruleCode} rank 2 minimum`
        ),
        rank_1_min_value: validateThresholdValue(
          fallback.rank_1_min_value,
          `${ruleCode} rank 1 minimum`
        ),
        score_weight: normalizeScoreWeight(fallback.score_weight, 1)
      };
      continue;
    }

    const rank4 = validateThresholdValue(incoming.rank_4_min_value, `${ruleCode} rank 4 minimum`);
    const rank3 = validateThresholdValue(incoming.rank_3_min_value, `${ruleCode} rank 3 minimum`);
    const rank2 = validateThresholdValue(incoming.rank_2_min_value, `${ruleCode} rank 2 minimum`);
    const rank1 = validateThresholdValue(incoming.rank_1_min_value, `${ruleCode} rank 1 minimum`);

    if (!(rank4 <= rank3 && rank3 <= rank2 && rank2 <= rank1)) {
      throw new Error(
        `${ruleCode} thresholds must increase from rank 4 to rank 1`
      );
    }

    normalized[ruleCode] = {
      rule_code: ruleCode,
      rank_4_min_value: rank4,
      rank_3_min_value: rank3,
      rank_2_min_value: rank2,
      rank_1_min_value: rank1,
      score_weight: normalizeScoreWeight(incoming.score_weight, fallback.score_weight)
    };
  }

  return normalized;
};

const resolveCriterionRank = (value, rule) => {
  const metric = normalizeIntegerMetric(value);
  const thresholds = rule || {};

  if (metric >= normalizeIntegerMetric(thresholds.rank_1_min_value)) return 1;
  if (metric >= normalizeIntegerMetric(thresholds.rank_2_min_value)) return 2;
  if (metric >= normalizeIntegerMetric(thresholds.rank_3_min_value)) return 3;
  if (metric >= normalizeIntegerMetric(thresholds.rank_4_min_value)) return 4;
  return 5;
};

const getCriterionScoreCap = (rule) => {
  const ruleCode = String(rule?.rule_code || "").toUpperCase();
  return normalizeScoreWeight(CRITERION_SCORE_CAPS[ruleCode], 0);
};

const calculateCriterionScore = (metricValue, rule) => {
  const metric = normalizeIntegerMetric(metricValue);
  const scoreCap = getCriterionScoreCap(rule);
  if (scoreCap <= 0) return 0;

  const rankOneThreshold = normalizeIntegerMetric(rule?.rank_1_min_value);
  if (rankOneThreshold <= 0) {
    return roundScore(scoreCap);
  }

  const progressRatio = Math.min(metric / rankOneThreshold, 1);
  return roundScore(progressRatio * scoreCap);
};

const attachCurrentRankMetrics = async (rows, groupId, executor) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length === 0) return safeRows;

  const ruleConfig = await getResolvedGroupRankRuleConfig(groupId, executor);
  const rules = ruleConfig.effectiveRules;
  const reviewAt = toSqlDateTime(new Date());
  const membershipIds = safeRows.map((row) => Number(row.membership_id)).filter(Boolean);
  const studentIds = [...new Set(safeRows.map((row) => row.student_id).filter(Boolean))];

  const [contributionRows, loyaltyRows, reliabilityRows] = await Promise.all([
    repo.getMembershipContributionTotals(membershipIds, reviewAt, executor),
    repo.getMembershipLoyaltyCounts(membershipIds, reviewAt, executor),
    repo.getStudentReliabilityCounts(studentIds, reviewAt, executor)
  ]);

  const contributionMap = new Map(
    contributionRows.map((row) => [String(row.membership_id), normalizeIntegerMetric(row.contribution_points)])
  );
  const loyaltyMap = new Map(
    loyaltyRows.map((row) => [String(row.membership_id), normalizeIntegerMetric(row.loyalty_phase_count)])
  );
  const reliabilityMap = new Map(
    reliabilityRows.map((row) => [
      String(row.student_id),
      normalizeIntegerMetric(row.reliability_eligible_phase_count)
    ])
  );

  return safeRows.map((row) => {
    const loyaltyPhaseCount = loyaltyMap.get(String(row.membership_id)) || 0;
    const contributionPoints = contributionMap.get(String(row.membership_id)) || 0;
    const reliabilityEligiblePhaseCount = reliabilityMap.get(String(row.student_id)) || 0;

    const loyaltyEligibleRank = resolveCriterionRank(loyaltyPhaseCount, rules.LOYALTY);
    const contributionEligibleRank = resolveCriterionRank(contributionPoints, rules.CONTRIBUTION);
    const reliabilityEligibleRank = resolveCriterionRank(
      reliabilityEligiblePhaseCount,
      rules.RELIABILITY
    );

    const loyaltyScore = calculateCriterionScore(loyaltyPhaseCount, rules.LOYALTY);
    const contributionScore = calculateCriterionScore(contributionPoints, rules.CONTRIBUTION);
    const reliabilityScore = calculateCriterionScore(
      reliabilityEligiblePhaseCount,
      rules.RELIABILITY
    );

    return {
      ...row,
      current_loyalty_phase_count: loyaltyPhaseCount,
      current_loyalty_eligible_rank: loyaltyEligibleRank,
      current_loyalty_score: loyaltyScore,
      current_contribution_points: contributionPoints,
      current_contribution_eligible_rank: contributionEligibleRank,
      current_contribution_score: contributionScore,
      current_reliability_eligible_phase_count: reliabilityEligiblePhaseCount,
      current_reliability_eligible_rank: reliabilityEligibleRank,
      current_reliability_score: reliabilityScore,
      current_total_score: roundScore(loyaltyScore + contributionScore + reliabilityScore),
      current_rank_review_eligible: loyaltyPhaseCount >= MIN_GROUP_PHASES_FOR_RANK_DETAILS,
      current_group_rank_rule_source: ruleConfig.hasGroupOverride ? "GROUP" : "SYSTEM"
    };
  });
};

const compareReviewCandidates = (a, b) => {
  const totalScoreDiff = Number(b?.total_score || 0) - Number(a?.total_score || 0);
  if (totalScoreDiff !== 0) return totalScoreDiff;

  const contributionDiff =
    normalizeIntegerMetric(b?.contribution_points) - normalizeIntegerMetric(a?.contribution_points);
  if (contributionDiff !== 0) return contributionDiff;

  const reliabilityDiff =
    normalizeIntegerMetric(b?.reliability_eligible_phase_count) -
    normalizeIntegerMetric(a?.reliability_eligible_phase_count);
  if (reliabilityDiff !== 0) return reliabilityDiff;

  const loyaltyDiff =
    normalizeIntegerMetric(b?.loyalty_phase_count) - normalizeIntegerMetric(a?.loyalty_phase_count);
  if (loyaltyDiff !== 0) return loyaltyDiff;

  const joinDateDiff = (parseDateForSort(a?.join_date) || 0) - (parseDateForSort(b?.join_date) || 0);
  if (joinDateDiff !== 0) return joinDateDiff;

  return Number(a?.membership_id || 0) - Number(b?.membership_id || 0);
};

const buildReviewRankQueue = () =>
  LIMITED_MEMBER_RANKS.flatMap((rank) => Array.from({ length: MEMBER_RANK_LIMIT }, () => rank));

const determineRankMovement = (previousRank, nextRank) => {
  const previous = normalizeManualRank(previousRank);
  const next = normalizeManualRank(nextRank) || 5;

  if (previous === null) return "NEW";
  if (next < previous) return "PROMOTED";
  if (next > previous) return "DEMOTED";
  return "UNCHANGED";
};

const formatReviewCriteria = (row) => {
  const cycle = normalizeIntegerMetric(row?.member_rank_review_cycle_number);
  const totalScore = roundScore(row?.member_rank_total_score);
  const loyaltyCount = normalizeIntegerMetric(row?.member_rank_loyalty_phase_count);
  const contributionPoints = normalizeIntegerMetric(row?.member_rank_contribution_points);
  const reliabilityCount = normalizeIntegerMetric(row?.member_rank_reliability_eligible_phase_count);

  if (!cycle) {
    return "Awaiting first 5-phase review";
  }

  return `Review cycle ${cycle}: score ${totalScore}, loyalty ${loyaltyCount} phases, contribution ${contributionPoints} pts, reliability ${reliabilityCount} eligible phases`;
};

const resolveDisplayedMemberRank = (row) => {
  const manualRank = normalizeManualRank(row?.member_rank_override);
  const reviewRank = normalizeManualRank(row?.latest_rank_overall_rank);
  const loyaltyPhaseCount = normalizeIntegerMetric(
    row?.latest_rank_loyalty_phase_count ?? row?.current_loyalty_phase_count
  );
  const resolvedRank = manualRank ?? reviewRank ?? 5;
  const rule = getRankRuleEntry(resolvedRank);

  if (manualRank !== null) {
    return {
      rank: resolvedRank,
      label: rule.label,
      criteria: "Manually assigned by captain/admin",
      source: "OVERRIDE"
    };
  }

  if (reviewRank !== null) {
    const isReviewEligible = loyaltyPhaseCount >= MIN_GROUP_PHASES_FOR_RANK_DETAILS;
    return {
      rank: resolvedRank,
      label: rule.label,
      criteria: isReviewEligible
        ? formatReviewCriteria({
            member_rank_review_cycle_number: row?.latest_rank_review_cycle_number,
            member_rank_total_score: row?.latest_rank_total_score,
            member_rank_loyalty_phase_count: row?.latest_rank_loyalty_phase_count,
            member_rank_contribution_points: row?.latest_rank_contribution_points,
            member_rank_reliability_eligible_phase_count:
              row?.latest_rank_reliability_eligible_phase_count
          })
        : `Eligible after ${MIN_GROUP_PHASES_FOR_RANK_DETAILS} completed phases in this group (${loyaltyPhaseCount}/${MIN_GROUP_PHASES_FOR_RANK_DETAILS})`,
      source: isReviewEligible ? "REVIEW" : "PENDING"
    };
  }

  return {
    rank: 5,
    label: getRankRuleEntry(5).label,
    criteria: `Eligible after ${MIN_GROUP_PHASES_FOR_RANK_DETAILS} completed phases in this group`,
    source: "PENDING"
  };
};

const mapMemberRanks = (rows) =>
  (Array.isArray(rows) ? rows : []).map((row) => {
    const resolved = resolveDisplayedMemberRank(row);

    return {
      ...row,
      member_rank: resolved.rank,
      member_rank_label: resolved.label,
      member_rank_criteria: resolved.criteria,
      member_rank_min_points: null,
      member_rank_max_points: null,
      member_rank_source: resolved.source,
      member_rank_review_phase_id: row?.latest_rank_review_phase_id || null,
      member_rank_review_phase_name: row?.latest_rank_review_phase_name || null,
      member_rank_review_cycle_number: normalizeIntegerMetric(row?.latest_rank_review_cycle_number),
      member_rank_loyalty_phase_count: normalizeIntegerMetric(row?.latest_rank_loyalty_phase_count),
      member_rank_loyalty_rank: normalizeManualRank(row?.latest_rank_loyalty_rank),
      member_rank_loyalty_score: roundScore(row?.latest_rank_loyalty_score),
      member_rank_contribution_points: normalizeIntegerMetric(row?.latest_rank_contribution_points),
      member_rank_contribution_rank: normalizeManualRank(row?.latest_rank_contribution_rank),
      member_rank_contribution_score: roundScore(row?.latest_rank_contribution_score),
      member_rank_reliability_eligible_phase_count: normalizeIntegerMetric(
        row?.latest_rank_reliability_eligible_phase_count
      ),
      member_rank_reliability_rank: normalizeManualRank(row?.latest_rank_reliability_rank),
      member_rank_reliability_score: roundScore(row?.latest_rank_reliability_score),
      member_rank_total_score: roundScore(row?.latest_rank_total_score),
      member_rank_previous_overall_rank: normalizeManualRank(row?.latest_previous_overall_rank),
      member_rank_movement: row?.latest_rank_movement || null,
      member_rank_reviewed_at: row?.latest_rank_reviewed_at || null,
      member_rank_review_eligible:
        normalizeIntegerMetric(row?.current_loyalty_phase_count) >= MIN_GROUP_PHASES_FOR_RANK_DETAILS
    };
  });

const getCompletedReviewPhases = (phases) =>
  [...(Array.isArray(phases) ? phases : [])]
    .filter((phase) => String(phase?.status || "").toUpperCase() === "COMPLETED")
    .sort((a, b) => {
      const endTimeDiff =
        (parseDateForSort(buildDateTimeText(a?.end_date, a?.end_time, "23:59:59")) || 0) -
        (parseDateForSort(buildDateTimeText(b?.end_date, b?.end_time, "23:59:59")) || 0);
      if (endTimeDiff !== 0) return endTimeDiff;

      return String(a?.phase_id || "").localeCompare(String(b?.phase_id || ""));
    });

const evaluateAndPersistGroupRankReview = async (phase, reviewCycleNumber) => {
  const reviewAt = buildDateTimeText(phase?.end_date, phase?.end_time, "23:59:59");
  if (!reviewAt) return 0;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const memberships = await repo.getMembershipsActiveAt(reviewAt, conn);
    if (!Array.isArray(memberships) || memberships.length === 0) {
      await conn.commit();
      return 0;
    }

    const membershipIds = memberships.map((membership) => Number(membership.membership_id));
    const studentIds = [...new Set(memberships.map((membership) => membership.student_id).filter(Boolean))];

    const [contributionRows, loyaltyRows, reliabilityRows, previousRankRows] = await Promise.all([
      repo.getMembershipContributionTotals(membershipIds, reviewAt, conn),
      repo.getMembershipLoyaltyCounts(membershipIds, reviewAt, conn),
      repo.getStudentReliabilityCounts(studentIds, reviewAt, conn),
      repo.getLatestGroupRanksByMembershipIdsBeforeCycle(membershipIds, reviewCycleNumber, conn)
    ]);

    const contributionMap = new Map(
      contributionRows.map((row) => [String(row.membership_id), normalizeIntegerMetric(row.contribution_points)])
    );
    const loyaltyMap = new Map(
      loyaltyRows.map((row) => [String(row.membership_id), normalizeIntegerMetric(row.loyalty_phase_count)])
    );
    const reliabilityMap = new Map(
      reliabilityRows.map((row) => [
        String(row.student_id),
        normalizeIntegerMetric(row.reliability_eligible_phase_count)
      ])
    );
    const previousRankMap = new Map(
      previousRankRows.map((row) => [String(row.membership_id), normalizeManualRank(row.overall_rank)])
    );

    const groupBuckets = new Map();

    memberships.forEach((membership) => {
      const loyaltyPhaseCount = loyaltyMap.get(String(membership.membership_id)) || 0;
      const contributionPoints = contributionMap.get(String(membership.membership_id)) || 0;
      const reliabilityEligiblePhaseCount = reliabilityMap.get(String(membership.student_id)) || 0;

      const candidate = {
        review_phase_id: phase.phase_id,
        review_cycle_number: reviewCycleNumber,
        group_id: Number(membership.group_id),
        membership_id: Number(membership.membership_id),
        student_id: membership.student_id,
        membership_role: String(membership.role || "MEMBER").toUpperCase(),
        join_date: membership.join_date,
        loyalty_phase_count: loyaltyPhaseCount,
        contribution_points: contributionPoints,
        reliability_eligible_phase_count: reliabilityEligiblePhaseCount,
        previous_overall_rank: previousRankMap.get(String(membership.membership_id)) || null,
        evaluation_basis: "PHASE_REVIEW"
      };

      const bucket = groupBuckets.get(candidate.group_id) || [];
      bucket.push(candidate);
      groupBuckets.set(candidate.group_id, bucket);
    });

    const reviewRankQueue = buildReviewRankQueue();
    const groupRuleConfigCache = new Map();
    const rowsToPersist = [];

    for (const [groupId, candidates] of groupBuckets.entries()) {
      let ruleConfig = groupRuleConfigCache.get(groupId);
      if (!ruleConfig) {
        ruleConfig = await getResolvedGroupRankRuleConfig(groupId, conn);
        groupRuleConfigCache.set(groupId, ruleConfig);
      }

      const rules = ruleConfig.effectiveRules;
      const hydratedCandidates = candidates.map((candidate) => {
        const loyaltyRank = resolveCriterionRank(candidate.loyalty_phase_count, rules.LOYALTY);
        const contributionRank = resolveCriterionRank(
          candidate.contribution_points,
          rules.CONTRIBUTION
        );
        const reliabilityRank = resolveCriterionRank(
          candidate.reliability_eligible_phase_count,
          rules.RELIABILITY
        );
        const loyaltyScore = calculateCriterionScore(candidate.loyalty_phase_count, rules.LOYALTY);
        const contributionScore = calculateCriterionScore(
          candidate.contribution_points,
          rules.CONTRIBUTION
        );
        const reliabilityScore = calculateCriterionScore(
          candidate.reliability_eligible_phase_count,
          rules.RELIABILITY
        );

        return {
          ...candidate,
          loyalty_rank: loyaltyRank,
          contribution_rank: contributionRank,
          reliability_rank: reliabilityRank,
          loyalty_score: loyaltyScore,
          contribution_score: contributionScore,
          reliability_score: reliabilityScore,
          total_score: roundScore(loyaltyScore + contributionScore + reliabilityScore),
          review_eligible:
            normalizeIntegerMetric(candidate.loyalty_phase_count) >=
            MIN_GROUP_PHASES_FOR_RANK_DETAILS
        };
      });

      const eligibleCandidates = hydratedCandidates
        .filter((candidate) => candidate.review_eligible)
        .sort(compareReviewCandidates);
      const ineligibleCandidates = hydratedCandidates.filter(
        (candidate) => !candidate.review_eligible
      );

      eligibleCandidates.forEach((candidate, index) => {
        const overallRank = reviewRankQueue[index] || 5;
        rowsToPersist.push({
          ...candidate,
          overall_rank: overallRank,
          rank_movement: determineRankMovement(candidate.previous_overall_rank, overallRank)
        });
      });

      ineligibleCandidates.forEach((candidate) => {
        rowsToPersist.push({
          ...candidate,
          overall_rank: 5,
          rank_movement: determineRankMovement(candidate.previous_overall_rank, 5)
        });
      });
    }

    await repo.upsertGroupRankRows(rowsToPersist, conn);
    await conn.commit();
    return rowsToPersist.length;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const syncPendingGroupRankReviews = async () => {
  if (syncPendingGroupRankReviewsPromise) {
    return syncPendingGroupRankReviewsPromise;
  }

  syncPendingGroupRankReviewsPromise = (async () => {
    const phases = await phaseRepo.getAllPhases();
    const completedPhases = getCompletedReviewPhases(phases);
    let processedRows = 0;

    for (let index = 0; index < completedPhases.length; index += 1) {
      const reviewCycleNumber = index + 1;
      if (reviewCycleNumber % GROUP_RANK_REVIEW_INTERVAL !== 0) continue;

      const phase = completedPhases[index];
      const hasReviewSnapshot = await repo.hasGroupRankReviewForPhase(phase.phase_id);
      if (hasReviewSnapshot) continue;

      processedRows += await evaluateAndPersistGroupRankReview(phase, reviewCycleNumber);
    }

    return {
      processed_rows: processedRows,
      completed_phase_count: completedPhases.length
    };
  })().finally(() => {
    syncPendingGroupRankReviewsPromise = null;
  });

  return syncPendingGroupRankReviewsPromise;
};

const getRejoinDeadlineInfo = async (studentId, options = {}) => {
  const latestLeft = await repo.findLatestLeftMembershipByStudent(studentId, options.executor);
  if (!latestLeft?.leave_date) {
    return {
      has_rejoin_deadline: false,
      rule: REJOIN_DEADLINE_RULE,
      deadline_hours: REJOIN_DEADLINE_HOURS,
      latest_left_membership_id: latestLeft?.membership_id || null,
      left_group_id: latestLeft?.group_id || null,
      left_at: null,
      rejoin_deadline_at: null,
      is_expired: false
    };
  }

  const leftAt = new Date(latestLeft.leave_date);
  const deadlineAt = getRejoinDeadlineFromLeaveDate(leftAt);
  const now = options.now ? new Date(options.now) : new Date();
  const expired =
    !Number.isNaN(now.getTime()) &&
    deadlineAt instanceof Date &&
    !Number.isNaN(deadlineAt.getTime()) &&
    now.getTime() > deadlineAt.getTime();

  return {
    has_rejoin_deadline: true,
    rule: REJOIN_DEADLINE_RULE,
    deadline_hours: REJOIN_DEADLINE_HOURS,
    latest_left_membership_id: latestLeft.membership_id,
    left_group_id: latestLeft.group_id,
    left_at: leftAt,
    rejoin_deadline_at: deadlineAt,
    is_expired: expired
  };
};

const ensureRejoinDeadlineCompliance = async (studentId, options = {}) => {
  const info = await getRejoinDeadlineInfo(studentId, options);
  if (!info.has_rejoin_deadline || !info.is_expired || options.allowExpired === true) {
    return info;
  }

  const leftText = formatDateTime(info.left_at) || "unknown";
  const deadlineText = formatDateTime(info.rejoin_deadline_at) || "unknown";

  throw new Error(
    `Join deadline expired. Student left group ${info.left_group_id} on ${leftText} and must join by the end of the next working day (${deadlineText}). Admin approval is required.`
  );
};

const ensureChangeDayLeaveAllowed = async (policy, options = {}) => {
  if (options.bypassChangeDay) return;
  if (!policy.enforce_change_day_for_leave) return;

  const phase = await phaseRepo.getCurrentPhase();
  if (!phase) {
    throw new Error("No active phase found. Leave is allowed only on Change Day.");
  }

  const today = toDateOnly(new Date());
  const changeDay = toDateOnly(phase.change_day);

  if (!today || !changeDay || today !== changeDay) {
    throw new Error("Leave is allowed only on Change Day");
  }
};

const ensureActorCanManageMembership = async (conn, actorUser, groupId) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");

  const actorRole = String(actorUser.role).toUpperCase();

  if (ADMIN_ROLES.includes(actorRole)) {
    const [adminRows] = await conn.query(
      "SELECT admin_id FROM admins WHERE user_id=? LIMIT 1",
      [actorUser.userId]
    );
    if (adminRows.length === 0) throw new Error("Admin not found");
    return;
  }

  const [studentRows] = await conn.query(
    "SELECT student_id FROM students WHERE user_id=? LIMIT 1",
    [actorUser.userId]
  );
  if (studentRows.length === 0) throw new Error("Student not found");

  const studentId = studentRows[0].student_id;
  const [captainRows] = await conn.query(
    `SELECT membership_id
     FROM memberships
     WHERE student_id=? AND group_id=? AND status='ACTIVE' AND role='CAPTAIN'
     LIMIT 1`,
    [studentId, groupId]
  );

  if (captainRows.length === 0) {
    throw new Error("Only the group captain can modify group members");
  }
};

const joinGroupService = async (student_id, groupId, role) => {
  const normalizedRole = String(role || "MEMBER")
    .trim()
    .toUpperCase();
  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new Error("Invalid role");
  }

  const policy = await systemConfigService.getOperationalPolicy();
  const existing = await repo.findActiveMembershipByStudent(student_id);

  if (existing.length > 0) {
    throw new Error("Student already belongs to a group");
  }

  await ensureRejoinDeadlineCompliance(student_id);

  const [groupRows] = await db.query(
    "SELECT group_id, status FROM Sgroup WHERE group_id=? LIMIT 1",
    [groupId]
  );
  const group = groupRows[0];
  if (!group) {
    throw new Error("Group not found");
  }
  if (String(group.status || "").toUpperCase() === "FROZEN") {
    throw new Error("Cannot join a frozen group");
  }

  const currentCount = await repo.countGroupMembers(groupId);
  if (currentCount >= Number(policy.max_group_members)) {
    throw new Error("Group is full");
  }

  if (LEADERSHIP_ROLES.includes(normalizedRole)) {
    const [sameRoleRows] = await db.query(
      `SELECT membership_id
       FROM memberships
       WHERE group_id=? AND status='ACTIVE' AND role=?
       LIMIT 1`,
      [groupId, normalizedRole]
    );
    if (sameRoleRows.length > 0) {
      throw new Error(`This group already has a ${normalizedRole}`);
    }
  }

  await repo.createMembership(student_id, groupId, normalizedRole);

  const count = await repo.countGroupMembers(groupId);
  const status = resolveGroupStatusByCount(count, policy);
  await repo.updateGroupStatus(groupId, status);

  return {
    student_id,
    group_id: Number(groupId),
    role: normalizedRole,
    membership_status: "ACTIVE",
    memberCount: count,
    status
  };
};

const leaveGroupService = async (studentId, groupId, options = {}) => {
  const policy = await systemConfigService.getOperationalPolicy();
  await ensureChangeDayLeaveAllowed(policy, options);

  const membership = await repo.findActiveMembershipByStudentAndGroup(studentId, groupId);
  if (!membership) throw new Error("Active membership not found");

  await repo.leaveMembershipByStudentAndGroup(studentId, groupId);

  const count = await repo.countGroupMembers(groupId);
  const status = resolveGroupStatusByCount(count, policy);
  await repo.updateGroupStatus(groupId, status);

  const rejoinDeadlineAt = getRejoinDeadlineFromLeaveDate(new Date());

  return {
    student_id: studentId,
    group_id: Number(groupId),
    membership_status: "LEFT",
    memberCount: count,
    status,
    leave_deadline_days: 1,
    rejoin_deadline_rule: REJOIN_DEADLINE_RULE,
    rejoin_deadline_at:
      rejoinDeadlineAt && !Number.isNaN(rejoinDeadlineAt.getTime())
        ? rejoinDeadlineAt.toISOString()
        : null
  };
};

const getMembersService = async (groupId) => {
  const rows = await repo.getGroupMembers(groupId);
  const rowsWithCurrentMetrics = await attachCurrentRankMetrics(rows || [], groupId);
  return mapMemberRanks(rowsWithCurrentMetrics || []);
};

const getGroupRankHistoryService = async (groupId) => {
  return repo.getGroupRankHistory(groupId);
};

const getGroupRankRulesService = async (groupId) => {
  const ruleConfig = await getResolvedGroupRankRuleConfig(groupId);

  return {
    group_id: Number(groupId),
    has_group_override: ruleConfig.hasGroupOverride,
    group_override_updated_at: ruleConfig.groupOverrideUpdatedAt,
    system_rules: Object.values(ruleConfig.systemRules).map((rule) => ({
      rule_code: rule.rule_code,
      rule_name: rule.rule_name,
      rank_4_min_value: normalizeIntegerMetric(rule.rank_4_min_value),
      rank_3_min_value: normalizeIntegerMetric(rule.rank_3_min_value),
      rank_2_min_value: normalizeIntegerMetric(rule.rank_2_min_value),
      rank_1_min_value: normalizeIntegerMetric(rule.rank_1_min_value),
      score_weight: normalizeScoreWeight(rule.score_weight, 1)
    })),
    effective_rules: Object.values(ruleConfig.effectiveRules).map((rule) => ({
      rule_code: rule.rule_code,
      rule_name: rule.rule_name,
      rank_4_min_value: normalizeIntegerMetric(rule.rank_4_min_value),
      rank_3_min_value: normalizeIntegerMetric(rule.rank_3_min_value),
      rank_2_min_value: normalizeIntegerMetric(rule.rank_2_min_value),
      rank_1_min_value: normalizeIntegerMetric(rule.rank_1_min_value),
      score_weight: normalizeScoreWeight(rule.score_weight, 1),
      source: ruleConfig.overridesByCode[rule.rule_code] ? "GROUP" : "SYSTEM"
    }))
  };
};

const updateGroupRankRulesService = async (groupId, payload, actorUser) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [groupRows] = await conn.query(
      "SELECT group_id FROM Sgroup WHERE group_id = ? LIMIT 1",
      [Number(groupId)]
    );
    if (groupRows.length === 0) {
      throw new Error("Group not found");
    }

    await ensureActorCanManageMembership(conn, actorUser, Number(groupId));

    let updatedByMembershipId = null;
    if (!ADMIN_ROLES.includes(String(actorUser?.role || "").toUpperCase())) {
      const [studentRows] = await conn.query(
        "SELECT student_id FROM students WHERE user_id=? LIMIT 1",
        [actorUser.userId]
      );
      const actorStudentId = studentRows?.[0]?.student_id || null;
      const [membershipRows] = await conn.query(
        `SELECT membership_id
         FROM memberships
         WHERE student_id = ?
           AND group_id = ?
           AND status = 'ACTIVE'
         LIMIT 1`,
        [actorStudentId, Number(groupId)]
      );
      updatedByMembershipId = membershipRows?.[0]?.membership_id || null;
    }

    if (payload?.use_system_default === true) {
      await repo.clearGroupRankRuleOverrides(groupId, conn);
      await conn.commit();
      const result = await getGroupRankRulesService(groupId);
      return {
        ...result,
        group_id: Number(groupId)
      };
    }

    const currentRuleConfig = await getResolvedGroupRankRuleConfig(groupId, conn);
    const normalizedRules = normalizeGroupRankRulePayload(
      payload?.rules,
      currentRuleConfig.effectiveRules
    );

    await repo.upsertGroupRankRuleOverrides(
      groupId,
      normalizedRules,
      updatedByMembershipId,
      conn
    );

    await conn.commit();
    const result = await getGroupRankRulesService(groupId);
    return {
      ...result,
      group_id: Number(groupId)
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const updateRoleService = async (membershipId, newRole, actorUser) => {
  if (!VALID_ROLES.includes(newRole)) throw new Error("Invalid role");

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mRows] = await conn.query(
      "SELECT * FROM memberships WHERE membership_id=? FOR UPDATE",
      [membershipId]
    );
    const membership = mRows[0];
    if (!membership) throw new Error("Membership not found");
    if (membership.status !== "ACTIVE") throw new Error("Only ACTIVE membership can be updated");

    await ensureActorCanManageMembership(conn, actorUser, membership.group_id);

    if (LEADERSHIP_ROLES.includes(newRole)) {
      const [sameRoleRows] = await conn.query(
        `SELECT membership_id
         FROM memberships
         WHERE group_id=? AND role=? AND status='ACTIVE'
         LIMIT 1
         FOR UPDATE`,
        [membership.group_id, newRole]
      );

      if (
        sameRoleRows.length > 0 &&
        String(sameRoleRows[0].membership_id) !== String(membership.membership_id)
      ) {
        throw new Error(`This group already has a ${newRole}`);
      }
    }

    await conn.query(
      "UPDATE memberships SET role=? WHERE membership_id=?",
      [newRole, membershipId]
    );

    await conn.commit();
    return {
      message: "Role updated successfully",
      membership_id: Number(membershipId),
      student_id: membership.student_id,
      group_id: membership.group_id,
      role: newRole
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const updateRankService = async (membershipId, newRank, actorUser) => {
  const rank = normalizeManualRank(newRank);
  if (rank === null) throw new Error("Rank must be an integer between 1 and 5");

  const actorRole = String(actorUser?.role || "").toUpperCase();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mRows] = await conn.query(
      "SELECT * FROM memberships WHERE membership_id=? FOR UPDATE",
      [membershipId]
    );
    const membership = mRows[0];
    if (!membership) throw new Error("Membership not found");
    if (membership.status !== "ACTIVE") throw new Error("Only ACTIVE membership can be updated");

    await ensureActorCanManageMembership(conn, actorUser, membership.group_id);

    if (actorRole === "CAPTAIN") {
      const activeLeadershipCount = await repo.countActiveLeadershipRoles(membership.group_id, conn);
      if (activeLeadershipCount <= 2) {
        throw new Error(
          "Captain can override rank only when at least 3 active leadership roles are filled in the group"
        );
      }
    }

    if (LIMITED_MEMBER_RANKS.includes(rank)) {
      const groupRows = await repo.getGroupMembers(membership.group_id, conn);
      const resolvedRows = mapMemberRanks(groupRows || []);
      const occupiedCount = resolvedRows.filter(
        (row) =>
          String(row?.membership_id) !== String(membershipId) &&
          normalizeManualRank(row?.member_rank) === rank
      ).length;

      if (occupiedCount >= MEMBER_RANK_LIMIT) {
        throw new Error(`Only ${MEMBER_RANK_LIMIT} members can be assigned to Rank ${rank}`);
      }
    }

    await repo.updateMemberRank(membershipId, rank, conn);

    await conn.commit();
    return {
      message: "Rank updated successfully",
      membership_id: Number(membershipId),
      student_id: membership.student_id,
      group_id: membership.group_id,
      rank
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const getMyGroupService = async (studentId) => {
  return repo.getActiveMembershipWithGroupByStudent(studentId);
};

const getAllMembershipsService = async (query = {}) => {
  const pagination = parsePaginationQuery(query, {
    defaultLimit: 30,
    maxLimit: 200
  });
  const filters = {
    status: normalizeOptionalMembershipStatus(query?.status),
    group_id: normalizeOptionalPositiveInteger(query?.group_id, "group_id"),
    student_id: query?.student_id,
    role: normalizeOptionalMembershipRole(query?.role)
  };

  if (!pagination.enabled) {
    return repo.getAllMemberships(filters);
  }

  const { rows, total } = await repo.getAllMemberships(filters, {
    paginate: true,
    limit: pagination.limit,
    offset: pagination.offset
  });

  return buildPaginatedResponse({
    items: rows,
    total,
    page: pagination.page,
    limit: pagination.limit
  });
};

const adminLeaveMembershipService = async (membershipId) => {
  const membership = await repo.getMembershipById(membershipId);
  if (!membership) throw new Error("Membership not found");

  if (membership.status !== "ACTIVE") {
    throw new Error("Membership is already left");
  }

  const leaveResult = await leaveGroupService(membership.student_id, membership.group_id, {
    bypassChangeDay: true
  });

  return {
    membership_id: membershipId,
    student_id: membership.student_id,
    group_id: membership.group_id,
    membership_status: "LEFT",
    group_status: leaveResult.status
  };
};

const removeMembershipService = async (membershipId, actorUser, removalReason) => {
  const membership = await repo.getMembershipById(membershipId);
  if (!membership) throw new Error("Membership not found");

  const normalizedReason = String(removalReason || "").trim();
  if (!normalizedReason) {
    throw new Error("Removal reason is required");
  }

  if (membership.status !== "ACTIVE") {
    throw new Error("Membership is already left");
  }

  let bypassChangeDay = false;

  if (!actorUser?.role || !actorUser?.userId) {
    throw new Error("Unauthorized");
  }

  if (ADMIN_ROLES.includes(String(actorUser.role).toUpperCase())) {
    bypassChangeDay = true;
  } else {
    if (String(actorUser.role).toUpperCase() !== "CAPTAIN") {
      throw new Error("Only admin or group captain can remove memberships");
    }

    const conn = await db.getConnection();
    try {
      await ensureActorCanManageMembership(conn, actorUser, membership.group_id);

      const [studentRows] = await conn.query(
        "SELECT student_id FROM students WHERE user_id=? LIMIT 1",
        [actorUser.userId]
      );

      if (studentRows.length === 0) throw new Error("Student not found");

      const actorStudentId = studentRows[0].student_id;
      if (String(actorStudentId) === String(membership.student_id)) {
        throw new Error("Use Leave Group to leave your own membership");
      }
    } finally {
      conn.release();
    }
  }

  const leaveResult = await leaveGroupService(membership.student_id, membership.group_id, {
    bypassChangeDay
  });

  return {
    membership_id: membershipId,
    student_id: membership.student_id,
    group_id: membership.group_id,
    membership_status: "LEFT",
    group_status: leaveResult.status,
    removal_reason: normalizedReason
  };
};

module.exports = {
  REJOIN_DEADLINE_HOURS,
  REJOIN_DEADLINE_RULE,
  GROUP_RANK_REVIEW_INTERVAL,
  getRejoinDeadlineInfo,
  ensureRejoinDeadlineCompliance,
  syncPendingGroupRankReviews,
  joinGroupService,
  leaveGroupService,
  getMembersService,
  getGroupRankHistoryService,
  getGroupRankRulesService,
  updateGroupRankRulesService,
  updateRoleService,
  updateRankService,
  getMyGroupService,
  getAllMembershipsService,
  adminLeaveMembershipService,
  removeMembershipService
};
