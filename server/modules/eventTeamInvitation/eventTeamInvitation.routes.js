const express = require("express");
const router = express.Router();

const controller = require("./eventTeamInvitation.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(authenticate);

router.get(
  "/my",
  authorize("STUDENT", "CAPTAIN"),
  controller.getMyInvitations
);

router.put(
  "/:invitationId/respond",
  authorize("STUDENT", "CAPTAIN"),
  controller.respondToInvitation
);

module.exports = router;
