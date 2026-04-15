const express = require("express");

const controller = require("./onDuty.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

const router = express.Router();

router.use(authenticate);

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
