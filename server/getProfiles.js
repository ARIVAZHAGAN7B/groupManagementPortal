// controllers/profile.controller.js

const db = require("./config/db");
const service = require("./modules/joinRequest/joinRequest.service");

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // extracted from JWT middleware

    const [userRows] = await db.query(
      "SELECT name, role FROM users WHERE user_id = ?",
      [userId]
    );

    if (!userRows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, role } = userRows[0];

    const response = {
      userId,
      name,
      role,
    };

    if (role === "STUDENT") {
      const studentId = await service.getStudentIdByUserId(userId);
      response.studentId = studentId || null;
    }

    if (role === "ADMIN" || role === "SYSTEM_ADMIN") {
      const adminId = await service.getAdminIdByUserId(userId);
      response.adminId = adminId || null;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};