const mysql = require("mysql2/promise");
const env = require("./env");

const db = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: env.dbWaitForConnections,
  connectionLimit: env.dbConnectionLimit,
  maxIdle: env.dbMaxIdle,
  idleTimeout: env.dbIdleTimeoutMs,
  queueLimit: env.dbQueueLimit,
  enableKeepAlive: env.dbEnableKeepAlive,
  keepAliveInitialDelay: env.dbKeepAliveInitialDelayMs
});

module.exports = db;
