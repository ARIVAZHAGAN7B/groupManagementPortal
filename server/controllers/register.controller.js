const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

/**
 * Register Student
 */
const registerStudent = async (req, res) => {
  const { name, email, password, student_id, department, year } = req.body;

  try {
    // check if email already exists
    const [existing] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // insert into users
    await db.query(
      "INSERT INTO users (user_id, name, email, password_hash, role) VALUES (?,?,?,?,?)",
      [userId, name, email, passwordHash, "STUDENT"]
    );

    // insert into students
    await db.query(
      "INSERT INTO students (student_id, user_id, name, email, department, year) VALUES (?,?,?,?,?,?)",
      [student_id, userId, name, email, department, year]
    );

    res.status(201).json({ message: "Student registered successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
};

const registerMultipleStudents = async (req, res) => {
  const students = req.body; // expect an array of student objects

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: "No students provided" });
  }

  const results = [];
  const errors = [];

  for (const student of students) {
    const { name, email, password, student_id, department, year } = student;

    try {
      // Check if email already exists
      const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        errors.push({ email, message: "Email already registered" });
        continue;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      // Insert into users
      await db.query(
        "INSERT INTO users (user_id, name, email, password_hash, role) VALUES (?,?,?,?,?)",
        [userId, name, email, passwordHash, "STUDENT"]
      );

      // Insert into students
      await db.query(
        "INSERT INTO students (student_id, user_id, name, email, department, year) VALUES (?,?,?,?,?,?)",
        [student_id, userId, name, email, department, year]
      );

      results.push({ email, message: "Registered successfully" });

    } catch (err) {
      console.error(`Error for student ${email}:`, err);
      errors.push({ email, message: "Registration failed" });
    }
  }

  res.status(201).json({ success: results, failed: errors });
};


/**
 * Register Admin
 */
const registerAdmin = async (req, res) => {
  const { name, email, password, admin_id, admin_role } = req.body;

  try {
    const [existing] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.query(
      "INSERT INTO users (user_id, name, email, password_hash, role) VALUES (?,?,?,?,?)",
      [userId, name, email, passwordHash, admin_role]
    );

    await db.query(
      "INSERT INTO admins (admin_id, user_id, name, email, role) VALUES (?,?,?,?,?)",
      [admin_id, userId, name, email, admin_role]
    );

    res.status(201).json({ message: "Admin registered successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
};

module.exports = { registerStudent, registerAdmin, registerMultipleStudents };
