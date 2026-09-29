const phaseRepo = require("./phase.repository");
const eligibilityRepo = require("../eligibility/eligibility.repository");

const REQUIRED_TIERS = ["D", "C", "B", "A"];

const toDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const sortPhasesDesc = (rows = []) =>
  [...rows].sort((a, b) => {
    const aTime = toDateValue(a?.end_date || a?.start_date)?.getTime() || 0;
    const bTime = toDateValue(b?.end_date || b?.start_date)?.getTime() || 0;
    if (aTime !== bTime) return bTime - aTime;
    return String(b?.phase_id || "").localeCompare(String(a?.phase_id || ""));
  });

const getTargetMap = (rows = []) =>
  new Map(
    (Array.isArray(rows) ? rows : []).map((row) => [
      String(row?.tier || "").trim().toUpperCase(),
      Number(row?.group_target)
    ])
  );

const getEligibleAverageTarget = (rows = [], fieldName) => {
  const values = (Array.isArray(rows) ? rows : [])
    .map((row) => Number(row?.[fieldName]))
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (values.length === 0) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.ceil((total / values.length) * 0.9);
};

const buildEmptyRecommendation = () => ({
  source_phase_id: null,
  source_phase_name: null,
  source_strategy: "EMPTY_DEFAULT",
  targets: REQUIRED_TIERS.map((tier) => ({
    tier,
    group_target: 0
  })),
  individual_target: 0
});

const buildRecommendationFromPhase = async (phase) => {
  if (!phase?.phase_id) return null;

  const [groupEligibilityRows, individualEligibilityRows, configuredTargets, configuredIndividual] =
    await Promise.all([
      eligibilityRepo.getGroupEligibility(phase.phase_id),
      eligibilityRepo.getIndividualEligibility(phase.phase_id),
      phaseRepo.getPhaseTargets(phase.phase_id),
      phaseRepo.getIndividualPhaseTarget(phase.phase_id)
    ]);

  const configuredTargetMap = getTargetMap(configuredTargets);
  const eligibleGroups = (Array.isArray(groupEligibilityRows) ? groupEligibilityRows : []).filter(
    (row) => row?.is_eligible === true || row?.is_eligible === 1
  );
  const eligibleIndividuals = (
    Array.isArray(individualEligibilityRows) ? individualEligibilityRows : []
  ).filter((row) => row?.is_eligible === true || row?.is_eligible === 1);

  const targets = REQUIRED_TIERS.map((tier) => {
    const tierEligibleRows = eligibleGroups.filter((row) => {
      const resolvedTier = String(row?.allocation_tier || row?.tier || "")
        .trim()
        .toUpperCase();
      return resolvedTier === tier;
    });

    const computedTarget = getEligibleAverageTarget(
      tierEligibleRows,
      "this_phase_group_points"
    );
    const configuredTarget = configuredTargetMap.get(tier);

    return {
      tier,
      group_target:
        computedTarget !== null && computedTarget !== undefined
          ? computedTarget
          : Number.isFinite(configuredTarget)
            ? Number(configuredTarget)
            : 0
    };
  });

  const computedIndividualTarget = getEligibleAverageTarget(
    eligibleIndividuals,
    "this_phase_base_points"
  );
  const configuredIndividualTarget = Number(configuredIndividual?.target);
  const individual_target =
    computedIndividualTarget !== null && computedIndividualTarget !== undefined
      ? computedIndividualTarget
      : Number.isFinite(configuredIndividualTarget)
        ? configuredIndividualTarget
        : 0;

  const usedEligibilitySnapshot =
    eligibleGroups.length > 0 || eligibleIndividuals.length > 0;
  const hasConfiguredTargets =
    configuredTargets.length > 0 ||
    (configuredIndividual?.target !== undefined && configuredIndividual?.target !== null);

  if (!usedEligibilitySnapshot && !hasConfiguredTargets) {
    return null;
  }

  return {
    source_phase_id: phase.phase_id,
    source_phase_name: phase.phase_name,
    source_strategy: usedEligibilitySnapshot ? "ELIGIBILITY_SNAPSHOT" : "PHASE_TARGETS",
    targets,
    individual_target
  };
};

const getRecommendedTargets = async ({ reference_date } = {}) => {
  const phases = await phaseRepo.getAllPhases();
  const referenceDate = toDateValue(reference_date);
  const ordered = sortPhasesDesc(Array.isArray(phases) ? phases : []);
  const candidates = referenceDate
    ? ordered.filter((phase) => {
        const phaseEndDate = toDateValue(phase?.end_date || phase?.start_date);
        return phaseEndDate ? phaseEndDate < referenceDate : true;
      })
    : ordered;

  for (const phase of candidates) {
    const recommendation = await buildRecommendationFromPhase(phase);
    if (recommendation) {
      return recommendation;
    }
  }

  return buildEmptyRecommendation();
};

module.exports = {
  getRecommendedTargets
};
