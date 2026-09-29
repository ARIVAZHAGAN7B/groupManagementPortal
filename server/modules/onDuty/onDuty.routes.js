const express = require("express");

const controller = require("./onDuty.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

const router = express.Router();

router.use(authenticate);

// Admin routes - must be before /:id pattern
router.get(
  "/admin/events",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.listEventsWithOd
);

router.get(
  "/admin/events/:eventId/teams",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getEventTeamsWithOd
);

router.get(
  "/",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.listRequests
);

router.get(
  "/my",
  authorize("STUDENT", "CAPTAIN"),
  controller.getMyRequests
);

router.get(
  "/team/:teamId",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getTeamRequests
);

router.post(
  "/team/:teamId/apply",
  authorize("STUDENT", "CAPTAIN"),
  controller.submitRequest
);

router.put(
  "/:id/review",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.reviewRequest
);

module.exports = router;
