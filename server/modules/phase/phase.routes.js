const express = require("express");
const router = express.Router();

const phaseController = require("./phase.controller");

// middlewares (same as your previous modules)
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

// 🔐 All routes require authentication
router.use(authenticate);

/**
 * Admin only routes
 */
router.post(
  "/create",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  phaseController.createPhase
);

router.post(
  "/:phase_id/targets",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  phaseController.setPhaseTargets
);

/**
 * Authenticated users (Student / Captain / Admin can view)
 */
router.get(
  "/current",
  phaseController.getCurrentPhase
);

router.get(
  "/",
  phaseController.getAllPhases
);

router.get(
  "/:phase_id",
  phaseController.getPhaseById
);

router.get(
  "/:phase_id/targets",
  phaseController.getPhaseTargets
);

router.get(
  "/:phase_id/is-change-day",
  phaseController.isChangeDay
);

module.exports = router;
