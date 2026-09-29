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

const listDemoAccounts = async (req, res) => {
  try {
    const [students] = await db.query(
      `SELECT
         u.user_id AS userId,
         u.name,
         u.email,
         u.role,
         s.student_id AS accountId,
         s.department,
         s.year
       FROM users u
       INNER JOIN students s ON s.user_id = u.user_id
       WHERE u.status = 'ACTIVE'
         AND s.status = 'ACTIVE'
         AND u.role IN ('STUDENT', 'CAPTAIN')
       ORDER BY u.created_at DESC
       LIMIT 5`
    );

    const [admins] = await db.query(
      `SELECT
         u.user_id AS userId,
         u.name,
         u.email,
         u.role,
         a.admin_id AS accountId
       FROM users u
       INNER JOIN admins a ON a.user_id = u.user_id
       WHERE u.status = 'ACTIVE'
         AND a.status = 'ACTIVE'
         AND u.role IN ('ADMIN', 'SYSTEM_ADMIN')
       ORDER BY u.created_at DESC
       LIMIT 5`
    );

    res.json({
      students,
      admins
    });
  } catch (error) {
    console.error("Failed to load demo accounts:", error);
    res.status(500).json({ message: "Failed to load demo accounts" });
  }
};

const logout = (req, res) => {
  res.clearCookie("token", getCookieOptions());
  res.json({ message: "Logged out successfully" });
};

module.exports = { listDemoAccounts, login, logout };
