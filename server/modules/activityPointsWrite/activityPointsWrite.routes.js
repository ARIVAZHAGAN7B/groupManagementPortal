const express = require("express");

const controller = require("./activityPointsWrite.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize("ADMIN", "SYSTEM_ADMIN"));

router.get("/logs", controller.getSyncLogs);

module.exports = router;
