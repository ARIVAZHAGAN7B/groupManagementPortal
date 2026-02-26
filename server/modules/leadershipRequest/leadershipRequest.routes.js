const express = require("express");
const router = express.Router();

const controller = require("./leadershipRequest.controller");
const validation = require("./leadershipRequest.validation");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.post(
  "/apply",
  authenticate,
  authorize("STUDENT", "CAPTAIN"),
  validation.validateApplyLeadershipRoleRequest,
  controller.applyLeadershipRoleRequest
);

router.put(
  "/:requestId/decision",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  validation.validateLeadershipRoleDecision,
  controller.decideLeadershipRoleRequest
);

router.get(
  "/pending",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getAllPendingLeadershipRequests
);

router.get(
  "/group/:groupId/pending",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getPendingLeadershipRequestsByGroup
);

router.get(
  "/my",
  authenticate,
  authorize("STUDENT", "CAPTAIN"),
  controller.getMyLeadershipRoleRequests
);

router.get(
  "/admin/notifications",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getAdminLeadershipNotifications
);

module.exports = router;
