const express = require("express");
const router = express.Router();

const controller = require("./eventJoinRequest.controller");
const validation = require("./eventJoinRequest.validation");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.post(
  "/apply",
  authenticate,
  authorize("STUDENT", "CAPTAIN"),
  validation.validateApplyRequest,
  controller.applyEventJoinRequest
);

router.put(
  "/:requestId/decision",
  authenticate,
  authorize("STUDENT", "CAPTAIN", "ADMIN", "SYSTEM_ADMIN"),
  validation.validateDecision,
  controller.decideEventJoinRequest
);

router.get(
  "/team/:teamId/pending",
  authenticate,
  authorize("STUDENT", "CAPTAIN", "ADMIN", "SYSTEM_ADMIN"),
  controller.getPendingRequestsByTeam
);

router.get(
  "/my",
  authenticate,
  authorize("STUDENT", "CAPTAIN"),
  controller.getMyEventJoinRequests
);

module.exports = router;
