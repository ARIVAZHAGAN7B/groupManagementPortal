const bcrypt = require("bcrypt");
const db = require("../config/db");
const { generateToken } = require("../utils/jwt");

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for email:", email);
  console.log("Request body:", req.body);
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ? AND status='ACTIVE'",
    [email]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }
  console.log("User found:", rows[0]);
  const user = rows[0];
  const isMatch = await bcrypt.compare(password, rows[0].password_hash);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // false in localhost, true in production HTTPS
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({
    message: "Login successful",
    role: user.role,
    userId: user.user_id,
    name: user.name
  });
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

module.exports = { login, logout };
