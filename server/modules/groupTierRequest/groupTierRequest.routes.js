const express = require("express");
const router = express.Router();

const controller = require("./groupTierRequest.controller");
const validation = require("./groupTierRequest.validation");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.post(
  "/apply",
  authenticate,
  authorize("CAPTAIN", "ADMIN", "SYSTEM_ADMIN","STUDENT"),
  validation.validateApplyTierChangeRequest,
  controller.applyTierChangeRequest
);

router.put(
  "/:requestId/decision",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  validation.validateTierChangeDecision,
  controller.decideTierChangeRequest
);

router.get(
  "/pending",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getAllPendingTierChangeRequests
);

router.get(
  "/group/:groupId/pending",
  authenticate,
  authorize("CAPTAIN", "ADMIN", "SYSTEM_ADMIN"),
  controller.getPendingTierChangeRequestsByGroup
);

router.get(
  "/my",
  authenticate,
  authorize("CAPTAIN", "ADMIN", "SYSTEM_ADMIN"),
  controller.getMyTierChangeRequests
);

router.get(
  "/admin/notifications",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getAdminTierChangeNotifications
);

module.exports = router;

