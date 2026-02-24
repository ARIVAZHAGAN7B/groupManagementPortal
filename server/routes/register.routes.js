const express = require("express");
const { registerStudent, registerAdmin, registerMultipleStudents } = require("../controllers/register.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

const router = express.Router();

// only ADMIN / SYSTEM_ADMIN can create users
router.post(
  "/student",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  registerStudent
);

router.post(
  "/admin",
  authenticate,
  authorize("ADMIN", "SYSTEM_ADMIN"),
  registerAdmin
);

router.post("/seed",authenticate, authorize("ADMIN"), registerMultipleStudents);

module.exports = router;
