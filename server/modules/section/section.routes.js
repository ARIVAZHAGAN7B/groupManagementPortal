const express = require("express");

const controller = require("./section.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getSections
);

router.get(
  "/memberships",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getAllSectionMemberships
);

router.get(
  "/my-memberships",
  authorize("STUDENT", "CAPTAIN"),
  controller.getMySectionMemberships
);

router.get(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getSection
);

router.get(
  "/:id/memberships",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getSectionMemberships
);

router.post(
  "/",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.createSection
);

router.post(
  "/:id/memberships",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.addSectionMember
);

router.post(
  "/:id/join",
  authorize("STUDENT", "CAPTAIN"),
  controller.joinSectionAsSelf
);

router.put(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.updateSection
);

router.put(
  "/memberships/:membershipId",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.updateSectionMember
);

router.put(
  "/:id/activate",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.activateSection
);

router.put(
  "/:id/freeze",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.freezeSection
);

router.put(
  "/:id/archive",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.archiveSection
);

router.delete(
  "/memberships/:membershipId",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.leaveSectionMember
);

router.delete(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.deleteSection
);

module.exports = router;
