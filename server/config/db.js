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
  keepAliveInitialDelay: env.dbKeepAliveInitialDelayMs,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : undefined
});

const getPoolMetrics = () => {
  const pool = db?.pool;
  const total = pool?._allConnections?.length || 0;
  const free = pool?._freeConnections?.length || 0;
  const queued = pool?._connectionQueue?.length || 0;
  const active = Math.max(0, total - free);

  return {
    connection_limit: env.dbConnectionLimit,
    total_connections: total,
    active_connections: active,
    idle_connections: free,
    queued_requests: queued,
    wait_for_connections: env.dbWaitForConnections
  };
};

db.getPoolMetrics = getPoolMetrics;

module.exports = db;
