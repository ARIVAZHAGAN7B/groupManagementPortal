const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { expandDepartmentCode } = require("../utils/department.service");

const PASSWORD_SALT_ROUNDS = 10;
const BULK_HASH_CONCURRENCY = 4;

const normalizeStudentPayload = (student = {}) => ({
  name: String(student.name || "").trim(),
  email: String(student.email || "").trim().toLowerCase(),
  password: String(student.password || ""),
  student_id: String(student.student_id || "").trim(),
  department: expandDepartmentCode(student.department),
  year: student.year
});

const mapWithConcurrency = async (items = [], concurrency = 4, mapper) => {
  const safeItems = Array.isArray(items) ? items : [];
  const safeConcurrency = Math.max(1, Number(concurrency) || 1);
  const results = new Array(safeItems.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < safeItems.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(safeItems[currentIndex], currentIndex);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(safeConcurrency, safeItems.length) }, () => worker())
  );

  return results;
};

/**
 * Register Student
 */
const registerStudent = async (req, res) => {
  const { name, email, password, student_id, department, year } = normalizeStudentPayload(
    req.body
  );

  try {
    const [existing] = await db.query(
      "SELECT 1 FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const userId = uuidv4();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query(
        "INSERT INTO users (user_id, name, email, password_hash, role) VALUES (?,?,?,?,?)",
        [userId, name, email, passwordHash, "STUDENT"]
      );

      await conn.query(
        "INSERT INTO students (student_id, user_id, name, email, department, year) VALUES (?,?,?,?,?,?)",
        [student_id, userId, name, email, department, year]
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

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
  const normalizedStudents = students.map(normalizeStudentPayload);
  const seenEmails = new Set();
  const seenStudentIds = new Set();
  const candidates = [];

  normalizedStudents.forEach((student) => {
    if (!student.email || !student.student_id) {
      errors.push({
        email: student.email || null,
        student_id: student.student_id || null,
        message: "email and student_id are required"
      });
      return;
    }

    if (seenEmails.has(student.email)) {
      errors.push({ email: student.email, student_id: student.student_id, message: "Duplicate email in payload" });
      return;
    }

    if (seenStudentIds.has(student.student_id)) {
      errors.push({
        email: student.email,
        student_id: student.student_id,
        message: "Duplicate student_id in payload"
      });
      return;
    }

    seenEmails.add(student.email);
    seenStudentIds.add(student.student_id);
    candidates.push(student);
  });

  if (candidates.length > 0) {
    const emailPlaceholders = candidates.map(() => "?").join(", ");
    const studentIdPlaceholders = candidates.map(() => "?").join(", ");

    const [[existingEmailRows], [existingStudentRows]] = await Promise.all([
      db.query(
        `SELECT email
         FROM users
         WHERE email IN (${emailPlaceholders})`,
        candidates.map((student) => student.email)
      ),
      db.query(
        `SELECT student_id
         FROM students
         WHERE student_id IN (${studentIdPlaceholders})`,
        candidates.map((student) => student.student_id)
      )
    ]);

    const existingEmails = new Set(existingEmailRows.map((row) => String(row.email).toLowerCase()));
    const existingStudentIds = new Set(existingStudentRows.map((row) => String(row.student_id)));

    const readyStudents = candidates.filter((student) => {
      if (existingEmails.has(student.email)) {
        errors.push({
          email: student.email,
          student_id: student.student_id,
          message: "Email already registered"
        });
        return false;
      }

      if (existingStudentIds.has(student.student_id)) {
        errors.push({
          email: student.email,
          student_id: student.student_id,
          message: "student_id already registered"
        });
        return false;
      }

      return true;
    });

    const preparedStudents = await mapWithConcurrency(
      readyStudents,
      BULK_HASH_CONCURRENCY,
      async (student) => ({
        ...student,
        userId: uuidv4(),
        passwordHash: await bcrypt.hash(student.password, PASSWORD_SALT_ROUNDS)
      })
    );

    const conn = await db.getConnection();
    try {
      for (const student of preparedStudents) {
        try {
          await conn.beginTransaction();

          await conn.query(
            "INSERT INTO users (user_id, name, email, password_hash, role) VALUES (?,?,?,?,?)",
            [student.userId, student.name, student.email, student.passwordHash, "STUDENT"]
          );

          await conn.query(
            "INSERT INTO students (student_id, user_id, name, email, department, year) VALUES (?,?,?,?,?,?)",
            [
              student.student_id,
              student.userId,
              student.name,
              student.email,
              student.department,
              student.year
            ]
          );

          await conn.commit();
          results.push({ email: student.email, student_id: student.student_id, message: "Registered successfully" });
        } catch (error) {
          await conn.rollback();
          console.error(`Error for student ${student.email}:`, error);
          errors.push({
            email: student.email,
            student_id: student.student_id,
            message: "Registration failed"
          });
        }
      }
    } finally {
      conn.release();
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
      "SELECT 1 FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const userId = uuidv4();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query(
        "INSERT INTO users (user_id, name, email, password_hash, role) VALUES (?,?,?,?,?)",
        [userId, name, email, passwordHash, admin_role]
      );

      await conn.query(
        "INSERT INTO admins (admin_id, user_id, name, email, role) VALUES (?,?,?,?,?)",
        [admin_id, userId, name, email, admin_role]
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
};

module.exports = { registerStudent, registerAdmin, registerMultipleStudents };
