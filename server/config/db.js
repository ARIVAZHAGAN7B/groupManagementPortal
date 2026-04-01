const mysql = require("mysql2/promise");

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: toPositiveInt(process.env.DB_PORT, 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "test",
  waitForConnections: String(process.env.DB_WAIT_FOR_CONNECTIONS || "true").toLowerCase() !== "false",
  connectionLimit: toPositiveInt(process.env.DB_CONNECTION_LIMIT, 10),
  maxIdle: toPositiveInt(process.env.DB_MAX_IDLE, 10),
  idleTimeout: toPositiveInt(process.env.DB_IDLE_TIMEOUT_MS, 60000),
  queueLimit: Math.max(0, Number(process.env.DB_QUEUE_LIMIT) || 0),
  enableKeepAlive: String(process.env.DB_ENABLE_KEEPALIVE || "true").toLowerCase() !== "false",
  keepAliveInitialDelay: toPositiveInt(process.env.DB_KEEPALIVE_INITIAL_DELAY_MS, 0)
});

module.exports = db;
