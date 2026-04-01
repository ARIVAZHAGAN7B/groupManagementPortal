const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

const PASSWORD_SALT_ROUNDS = 10;

const readRequiredBootstrapEnv = (name) => {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing required bootstrap environment variable: ${name}`);
  }

  return value;
};

const bootstrapAdmin = async () => {
  const adminId = readRequiredBootstrapEnv("BOOTSTRAP_ADMIN_ID");
  const name = readRequiredBootstrapEnv("BOOTSTRAP_ADMIN_NAME");
  const email = readRequiredBootstrapEnv("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = readRequiredBootstrapEnv("BOOTSTRAP_ADMIN_PASSWORD");
  const adminRole = String(process.env.BOOTSTRAP_ADMIN_ROLE || "SYSTEM_ADMIN").trim().toUpperCase();

  if (!["ADMIN", "SYSTEM_ADMIN"].includes(adminRole)) {
    throw new Error("BOOTSTRAP_ADMIN_ROLE must be ADMIN or SYSTEM_ADMIN");
  }

  const userId = uuidv4();
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[existingUser], [existingAdmin]] = await Promise.all([
      conn.query("SELECT user_id FROM users WHERE email = ? LIMIT 1", [email]),
      conn.query("SELECT admin_id FROM admins WHERE admin_id = ? LIMIT 1", [adminId])
    ]);

    if (existingUser.length > 0) {
      throw new Error(`A user with email ${email} already exists`);
    }

    if (existingAdmin.length > 0) {
      throw new Error(`An admin with admin_id ${adminId} already exists`);
    }

    await conn.query(
      "INSERT INTO users (user_id, name, email, password_hash, role, status) VALUES (?,?,?,?,?,?)",
      [userId, name, email, passwordHash, adminRole, "ACTIVE"]
    );

    await conn.query(
      "INSERT INTO admins (admin_id, user_id, name, email, role, status) VALUES (?,?,?,?,?,?)",
      [adminId, userId, name, email, adminRole, "ACTIVE"]
    );

    await conn.commit();
    console.log(`Bootstrap admin created successfully for ${email}.`);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

bootstrapAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Bootstrap admin failed:", error?.message || error);
    process.exit(1);
  });
