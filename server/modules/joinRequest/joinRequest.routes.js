const express = require("express");
const router = express.Router();
const controller = require("./joinRequest.controller");
const { authenticate} = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const { validateApplyRequest, validateDecision } = require("./joinRequest.validation");

// Student applies to join group
router.post(
  "/apply",
  authenticate,
  authorize("STUDENT"),
  validateApplyRequest,
  controller.applyJoinRequest
);

// Captain/Admin approves or rejects
router.put(
  "/:requestId/decision",
  authenticate,
  authorize("STUDENT", "CAPTAIN", "ADMIN", "SYSTEM_ADMIN"),
  validateDecision,
  controller.decideJoinRequest
);

// View pending requests for a group (Captain/Admin)
router.get(
  "/group/:groupId/pending",
  authenticate,
  authorize("STUDENT", "CAPTAIN", "ADMIN", "SYSTEM_ADMIN"),
  controller.getPendingRequestsByGroup
);

// Student view own requests
router.get(
  "/my",
  authenticate,
  controller.getMyRequests
);

module.exports = router;
