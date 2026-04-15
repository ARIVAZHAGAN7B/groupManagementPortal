const eventRepo = require("./event.repository");
const hubRepo = require("../hub/hub.repository");
const {
  buildHubPriorityCountMap,
  formatHubPriorityLabel,
  formatHubPriorityRequirementSummary,
  getMissingHubPriorityRequirements
} = require("../hub/hubRules");

const getStudentHubQuotaSnapshot = async (studentId, executor = undefined) => {
  const rows = await hubRepo.getActiveHubMembershipCountsByStudent(studentId, executor);
  const counts = buildHubPriorityCountMap(rows);
  const missing = getMissingHubPriorityRequirements(counts);

  return {
    counts,
    missing,
    satisfied: missing.length === 0
  };
};

const ensureStudentMeetsHubQuotaForParticipation = async (
  studentId,
  executor = undefined
) => {
  const snapshot = await getStudentHubQuotaSnapshot(studentId, executor);
  if (snapshot.satisfied) {
    return snapshot;
  }

  throw new Error(
    `Students must join ${formatHubPriorityRequirementSummary()} priority hubs before participating in events`
  );
};

const ensureStudentMatchesEventHubRestriction = async (
  studentId,
  eventId,
  executor = undefined
) => {
  const allowedHubs = await eventRepo.getAllowedHubsByEventId(eventId, executor);
  if (!Array.isArray(allowedHubs) || allowedHubs.length === 0) {
    return {
      restricted: false,
      allowedHubs: []
    };
  }

  const matchingHub = await hubRepo.findActiveAllowedHubMembershipForEvent(
    studentId,
    eventId,
    executor
  );

  if (!matchingHub) {
    const labels = allowedHubs
      .map((hub) => {
        const name = hub?.team_name || hub?.team_code || `Hub ${hub?.hub_id}`;
        const priority = hub?.hub_priority
          ? ` (${formatHubPriorityLabel(hub.hub_priority)})`
          : "";
        return `${name}${priority}`;
      })
      .join(", ");

    throw new Error(
      `This event is restricted to specific hubs. Join one of these hubs to participate: ${labels}`
    );
  }

  return {
    restricted: true,
    allowedHubs,
    matchingHub
  };
};

const ensureStudentEligibleForEvent = async (
  studentId,
  eventLikeOrId,
  executor = undefined
) => {
  const eventId = Number(
    eventLikeOrId?.event_id ?? eventLikeOrId?.id ?? eventLikeOrId
  );

  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new Error("Event not found");
  }

  const hubQuota = await ensureStudentMeetsHubQuotaForParticipation(studentId, executor);
  const eventRestriction = await ensureStudentMatchesEventHubRestriction(
    studentId,
    eventId,
    executor
  );

  return {
    hubQuota,
    eventRestriction
  };
};

module.exports = {
  getStudentHubQuotaSnapshot,
  ensureStudentMeetsHubQuotaForParticipation,
  ensureStudentMatchesEventHubRestriction,
  ensureStudentEligibleForEvent
};
