const express = require("express");
const router = express.Router();

const controller = require("./eligibility.controller");
const validation = require("./eligibility.validation");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(authenticate);

router.post(
  "/base-points",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  validation.validateRecordBasePoints,
  controller.recordBasePoints
);

router.get(
  "/base-points/:student_id",
  authorize("ADMIN", "SYSTEM_ADMIN", "CAPTAIN"),
  validation.validateStudentIdParam,
  controller.getStudentBasePoints
);

router.get(
  "/admin/student-overview",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getAdminStudentOverview
);

router.get(
  "/leaderboards",
  authorize("STUDENT", "CAPTAIN", "ADMIN", "SYSTEM_ADMIN"),
  controller.getStudentLeaderboards
);

router.get(
  "/my-dashboard-summary",
  authorize("STUDENT", "CAPTAIN"),
  controller.getMyDashboardSummary
);

router.get(
  "/individual/me/history",
  authorize("STUDENT", "CAPTAIN"),
  controller.getMyIndividualEligibilityHistory
);

router.get(
  "/phases/:phase_id/groups/:group_id/summary",
  authorize("STUDENT", "CAPTAIN", "ADMIN", "SYSTEM_ADMIN"),
  controller.getGroupEligibilitySummary
);

router.post(
  "/phases/:phase_id/evaluate",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  validation.validateEvaluatePhase,
  controller.evaluatePhaseEligibility
);

router.get(
  "/phases/:phase_id/individual",
  authorize("ADMIN", "SYSTEM_ADMIN", "CAPTAIN"),
  controller.getIndividualEligibility
);

router.get(
  "/phases/:phase_id/group",
  authorize("ADMIN", "SYSTEM_ADMIN", "CAPTAIN"),
  controller.getGroupEligibility
);

router.get(
  "/phases/:phase_id/individual/me",
  authorize("STUDENT", "CAPTAIN"),
  controller.getMyIndividualEligibility
);

module.exports = router;
