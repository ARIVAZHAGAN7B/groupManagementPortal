const db = require("../../config/db");

const getUserStatusCounts = async (executor = db) => {
  const [rows] = await executor.query(
    `SELECT role, status, COUNT(*) AS total
     FROM users
     GROUP BY role, status`
  );
  return rows;
};

module.exports = {
  getUserStatusCounts
};
