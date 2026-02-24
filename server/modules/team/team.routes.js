const express = require("express");
const router = express.Router();

const controller = require("./team.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(authenticate);

router.get(
  "/",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getTeams
);

router.get(
  "/memberships",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getAllTeamMemberships
);

router.get(
  "/my-memberships",
  authorize("STUDENT", "CAPTAIN"),
  controller.getMyTeamMemberships
);

router.get(
  "/event/:eventId",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getTeamsByEvent
);

router.get(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getTeam
);

router.get(
  "/:id/memberships",
  authorize("ADMIN", "SYSTEM_ADMIN", "STUDENT", "CAPTAIN"),
  controller.getTeamMemberships
);

router.post(
  "/",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.createTeam
);

router.post(
  "/:id/memberships",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.addTeamMember
);

router.post(
  "/event/:eventId",
  authorize("STUDENT", "CAPTAIN"),
  controller.createTeamInEventByStudent
);

router.post(
  "/:id/join",
  authorize("STUDENT", "CAPTAIN"),
  controller.joinTeamAsSelf
);

router.put(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.updateTeam
);

router.put(
  "/memberships/:membershipId",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.updateTeamMember
);

router.put(
  "/:id/activate",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.activateTeam
);

router.put(
  "/:id/freeze",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.freezeTeam
);

router.put(
  "/:id/archive",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.archiveTeam
);

router.delete(
  "/memberships/:membershipId",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.leaveTeamMember
);

router.delete(
  "/:id",
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.deleteTeam
);

module.exports = router;
