const express = require("express");
const router = express.Router();

const controller = require("./event.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(authenticate);

router.get(
  "/",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getEvents
);

router.get(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getEvent
);

router.post(
  "/",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.createEvent
);

router.put(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.updateEvent
);

router.put(
  "/:id/activate",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.activateEvent
);

router.put(
  "/:id/close",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.closeEvent
);

router.put(
  "/:id/archive",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.archiveEvent
);

router.delete(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.deleteEvent
);

module.exports = router;
