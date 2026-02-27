const express = require("express");
const router = express.Router();

const controller = require("./teamChangeTier.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(authenticate);
router.use(authorize("ADMIN", "SYSTEM_ADMIN"));

router.get("/phases/:phase_id/preview", controller.getPhaseTierChangePreview);
router.get("/phases/:phase_id", controller.getPhaseWiseTeamChangeTier);
router.post("/phases/:phase_id/groups/:group_id/apply", controller.applyPhaseTierChange);

module.exports = router;

