const app = require("./app");
const db = require("./config/db"); // import your MySQL pool
require("dotenv").config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test the DB connection
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    console.log("DB connected, test query result:", rows[0].result);

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
};

startServer();
