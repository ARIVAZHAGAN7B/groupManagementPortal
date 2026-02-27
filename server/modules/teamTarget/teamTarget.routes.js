const express = require("express");
const router = express.Router();

const controller = require("./teamTarget.controller");
const validation = require("./teamTarget.validation");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(authenticate);
router.use(authorize("ADMIN", "SYSTEM_ADMIN"));

router.get("/", controller.getTeamTargets);
router.get("/:teamId", controller.getTeamTargetByTeamId);
router.put("/:teamId", validation.validateSetTeamTarget, controller.setTeamTarget);

module.exports = router;
