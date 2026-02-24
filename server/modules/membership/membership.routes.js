const express = require("express");
const router = express.Router();

const controller = require("./membership.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const validation = require("./membership.validation");

// Student join group
router.post(
  "/join/:groupId",
  authenticate,
  authorize("STUDENT"),
  validation.validateJoin,
  controller.joinGroup
);

// Leave group
router.post(
  "/leave",
  authenticate,
  authorize("STUDENT","CAPTAIN"),
  controller.leaveGroup
);

// View my active group (Student/Captain)
router.get(
  "/my-group",
  authenticate,
  authorize("STUDENT","CAPTAIN"),
  controller.getMyGroup
);

// Admin: view all memberships
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.getAllMemberships
);

// View group members
router.get(
  "/group/:groupId",
  authenticate,
  authorize("ADMIN","CAPTAIN","STUDENT", "SYSTEM_ADMIN"),
  controller.getGroupMembers
);

// Update role (Captain/Admin)
router.put(
  "/:membershipId/role",
  authenticate,
  authorize("STUDENT","CAPTAIN","ADMIN","SYSTEM_ADMIN"),
  validation.validateRole,
  controller.updateRole
);

// Admin: mark membership as left
router.delete(
  "/:membershipId",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  controller.adminLeaveMembership
);

module.exports = router;
