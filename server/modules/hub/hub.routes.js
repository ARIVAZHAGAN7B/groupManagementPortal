const express = require("express");
const router = express.Router();

const controller = require("./hub.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(authenticate);

router.get(
  "/",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getHubs
);

router.get(
  "/memberships",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getAllHubMemberships
);

router.get(
  "/my-memberships",
  authorize("STUDENT", "CAPTAIN"),
  controller.getMyHubMemberships
);

router.get(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getHub
);

router.get(
  "/:id/memberships",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getHubMemberships
);

router.post(
  "/",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.createHub
);

router.post(
  "/:id/join",
  authorize("STUDENT", "CAPTAIN"),
  controller.joinHubAsSelf
);

router.put(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.updateHub
);

router.put(
  "/memberships/:membershipId",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.updateHubMembership
);

router.put(
  "/:id/activate",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.activateHub
);

router.put(
  "/:id/freeze",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.freezeHub
);

router.put(
  "/:id/archive",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.archiveHub
);

router.delete(
  "/memberships/:membershipId",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.leaveHubMembership
);

router.delete(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.deleteHub
);

module.exports = router;
