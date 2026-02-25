const express = require("express");
const router = express.Router();

const controller = require("./group.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

/* ADMIN always, STUDENT conditionally via policy check in controller */
router.post(
  "/",
  authenticate,
  authorize("ADMIN","SYSTEM_ADMIN","STUDENT","CAPTAIN"),
  controller.createGroup
);

router.post(
  "/switch",
  authenticate,
  authorize("STUDENT","CAPTAIN"),
  controller.switchGroup
);

/* ADMIN + STUDENT */
router.get(
  "/",
  authenticate,
  authorize("ADMIN","SYSTEM_ADMIN","STUDENT","CAPTAIN"),
  controller.getGroups
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN","SYSTEM_ADMIN","STUDENT","CAPTAIN"),
  controller.getGroup
);

/* ADMIN only */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN","SYSTEM_ADMIN"),
  controller.updateGroup
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN","SYSTEM_ADMIN"),
  controller.deleteGroup
);

router.put(
  "/:id/activate",
  authenticate,
authorize("ADMIN","SYSTEM_ADMIN"),
controller.activateGroup);

router.put(
  "/:id/freeze",
  authenticate,
authorize("ADMIN","SYSTEM_ADMIN"),
controller.freezeGroup);

module.exports = router;
