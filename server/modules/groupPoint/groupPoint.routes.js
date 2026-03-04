const express = require("express");
const router = express.Router();

const controller = require("./groupPoint.controller");
const validation = require("./groupPoint.validation");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(authenticate);
router.use(authorize("ADMIN", "SYSTEM_ADMIN"));

router.get("/", controller.listGroupPoints);
router.get("/total", controller.getGroupPointTotal);
router.get("/:groupPointId", validation.validateGroupPointIdParam, controller.getGroupPointById);
router.post("/", validation.validateRecordGroupPoint, controller.recordGroupPoint);

module.exports = router;
