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

router.get("/holidays", controller.listHolidays);
router.get("/holidays/:id", controller.getHolidayById);
router.post("/holidays", controller.createHoliday);
router.put("/holidays/:id", controller.updateHoliday);
router.delete("/holidays/:id", controller.deleteHoliday);

module.exports = router;
