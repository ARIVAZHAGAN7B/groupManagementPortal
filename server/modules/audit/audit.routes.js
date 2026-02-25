const express = require("express");
const router = express.Router();

const controller = require("./audit.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(authenticate);
router.use(authorize("ADMIN", "SYSTEM_ADMIN"));

router.get("/", controller.listAuditLogs);

module.exports = router;
