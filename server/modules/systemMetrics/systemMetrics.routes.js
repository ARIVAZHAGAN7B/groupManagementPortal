const express = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const controller = require("./systemMetrics.controller");

const router = express.Router();

router.use(authenticate, authorize("ADMIN", "SYSTEM_ADMIN"));

router.get("/summary", controller.getSystemMetricsSummary);

module.exports = router;
