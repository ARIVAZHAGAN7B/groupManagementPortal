const bcrypt = require("bcrypt");
const db = require("../config/db");
const { createAuthSession, SESSION_DURATION_MS } = require("../utils/jwt");
const { getCookieOptions } = require("../config/runtime");

const login = async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query(
    `SELECT user_id, name, email, role, password_hash
     FROM users
     WHERE email = ?
       AND status = 'ACTIVE'
     LIMIT 1`,
    [email]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }
  const user = rows[0];
  const isMatch = await bcrypt.compare(password, rows[0].password_hash);

  if (!isMatch) {
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
