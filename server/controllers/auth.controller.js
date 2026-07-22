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
