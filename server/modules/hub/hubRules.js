const HUB_PRIORITY_LEVELS = ["PROMINENT", "MEDIUM", "LOW"];

const HUB_PRIORITY_REQUIREMENTS = {
  PROMINENT: 2,
  MEDIUM: 2,
  LOW: 2
};

const HUB_PRIORITY_LABELS = {
  PROMINENT: "prominent",
  MEDIUM: "medium",
  LOW: "low"
};

const normalizeText = (value) => String(value || "").trim();

const normalizeHubPriority = (value, options = {}) => {
  const {
    allowNull = false,
    fieldName = "hub_priority",
    required = false
  } = options;

  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return allowNull ? null : undefined;
  }

  const normalized = normalizeText(value).toUpperCase();
  if (!HUB_PRIORITY_LEVELS.includes(normalized)) {
    throw new Error(
      `${fieldName} must be one of: ${HUB_PRIORITY_LEVELS.join(", ")}`
    );
  }

  return normalized;
};

const formatHubPriorityLabel = (value) => {
  const normalized = normalizeText(value).toUpperCase();
  return HUB_PRIORITY_LABELS[normalized] || normalizeText(value).toLowerCase() || "unknown";
};

const buildHubPriorityCountMap = (rows = []) => {
  const counts = HUB_PRIORITY_LEVELS.reduce(
    (accumulator, priority) => ({
      ...accumulator,
      [priority]: 0
    }),
    {}
  );

  for (const row of Array.isArray(rows) ? rows : []) {
    const priority = normalizeHubPriority(row?.hub_priority, {
      allowNull: true
    });
    if (!priority) continue;
    counts[priority] = Number(row?.membership_count) || 0;
  }

  return counts;
};

const getMissingHubPriorityRequirements = (counts = {}) =>
  HUB_PRIORITY_LEVELS.reduce((missing, priority) => {
    const requiredCount = Number(HUB_PRIORITY_REQUIREMENTS[priority]) || 0;
    const currentCount = Number(counts?.[priority]) || 0;

    if (currentCount < requiredCount) {
      missing.push({
        priority,
        currentCount,
        requiredCount,
        remainingCount: requiredCount - currentCount
      });
    }

    return missing;
  }, []);

const formatHubPriorityRequirementSummary = () =>
  HUB_PRIORITY_LEVELS.map(
    (priority) => `${HUB_PRIORITY_REQUIREMENTS[priority]} ${formatHubPriorityLabel(priority)}`
  ).join(", ");

module.exports = {
  HUB_PRIORITY_LEVELS,
  HUB_PRIORITY_REQUIREMENTS,
  formatHubPriorityLabel,
  normalizeHubPriority,
  buildHubPriorityCountMap,
  getMissingHubPriorityRequirements,
  formatHubPriorityRequirementSummary
};
