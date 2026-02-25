const express = require("express");
const router = express.Router();

const controller = require("./systemConfig.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(authenticate);
router.use(authorize("ADMIN", "SYSTEM_ADMIN"));

router.get("/policy", controller.getPolicy);
router.put("/policy", controller.updatePolicy);

router.get("/incubation", controller.getIncubation);
router.put("/incubation", controller.updateIncubation);

module.exports = router;
