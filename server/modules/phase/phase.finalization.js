const repo = require("./phase.repository");
const eligibilityService = require("../eligibility/eligibility.service");
const membershipService = require("../membership/membership.service");
const { broadcastEligibilityChanged, broadcastPhaseChanged } = require("../../realtime/events");

const completePhaseWithEvaluation = async (phaseId, options = {}) => {
  const phase = await repo.getPhaseById(phaseId);
  if (!phase) {
    await repo.cancelPhaseEndJobByPhaseId(phaseId, "Phase not found");
    return {
      phase_id: phaseId,
      completed: false,
      missing: true
    };
  }

  const wasCompleted = String(phase.status || "").toUpperCase() === "COMPLETED";

  await eligibilityService.evaluatePhaseEligibility(phaseId);

  if (!wasCompleted) {
    await repo.updatePhaseStatus(phaseId, "COMPLETED");
  }

  await membershipService.syncPendingGroupRankReviews();

  await repo.completePhaseEndJobByPhaseId(phaseId);

  if (!wasCompleted && options.broadcast !== false) {
    broadcastEligibilityChanged({
      action: "PHASE_ELIGIBILITY_COMPLETED",
      scope: "PHASE",
      phaseId
    });
    broadcastPhaseChanged({
      action: "PHASE_COMPLETED",
      phaseId,
      status: "COMPLETED"
    });
  }

  return {
    phase_id: phaseId,
    completed: !wasCompleted,
    already_completed: wasCompleted
  };
};

module.exports = {
  completePhaseWithEvaluation
};
