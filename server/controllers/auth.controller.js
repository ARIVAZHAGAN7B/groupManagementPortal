const bcrypt = require("bcrypt");
const db = require("../config/db");
const { createAuthSession, SESSION_DURATION_MS } = require("../utils/jwt");
const { getCookieOptions } = require("../config/runtime");

// Dummy hash used for constant-time comparison when user does not exist (mitigates timing attacks & user enumeration)
const DUMMY_HASH = "$2b$10$wN1Qy2.2aJ3bE9M1iQpZ6u7z2x5v8y1w4t7r0q3p6s9m2k5h8j1n4";

const login = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const [rows] = await db.query(
    `SELECT user_id, name, email, role, password_hash
     FROM users
     WHERE email = ?
       AND status = 'ACTIVE'
     LIMIT 1`,
    [email]
  );

  const user = rows[0] || null;
  const hashToCompare = user ? user.password_hash : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const { token, sessionExpiresAt } = createAuthSession(user);

  res.cookie("token", token, {
    ...getCookieOptions(),
    maxAge: SESSION_DURATION_MS
  });

  res.json({
    message: "Login successful",
    role: user.role,
    userId: user.user_id,
    name: user.name,
    sessionExpiresAt
  });
};

const logout = (req, res) => {
  res.clearCookie("token", getCookieOptions());
  res.json({ message: "Logged out successfully" });
};

module.exports = { login, logout };
