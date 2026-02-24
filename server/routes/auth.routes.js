const express = require("express");
const { login, logout } = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, (req, res) => {
  // req.user is set by authenticate middleware
  console.log("Authenticated user:", req.user);
  res.json({ userId: req.user.userId, role: req.user.role, name: req.user.name });
});


module.exports = router;
