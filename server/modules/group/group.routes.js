const express = require("express");
const router = express.Router();

const controller = require("./group.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

/* ADMIN only */
router.post(
  "/",
  authenticate,
  authorize("ADMIN","SYSTEM_ADMIN"),
  controller.createGroup
);

/* ADMIN + STUDENT */
router.get(
  "/",
  authenticate,
  authorize("ADMIN","SYSTEM_ADMIN","STUDENT"),
  controller.getGroups
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN","SYSTEM_ADMIN","STUDENT"),
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
