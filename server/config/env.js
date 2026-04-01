const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const ms = require("ms");

const readRequiredEnv = (name) => {
  const value = process.env[name];
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return String(value).trim();
};

const readOptionalEnv = (name) => String(process.env[name] || "").trim();

const parseBooleanEnv = (name) => {
  const normalized = readRequiredEnv(name).toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  throw new Error(`Invalid boolean environment variable: ${name}`);
};

const parsePositiveIntEnv = (name) => {
  const parsed = Number(readRequiredEnv(name));
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return parsed;
};

const parseNonNegativeIntEnv = (name) => {
  const parsed = Number(readRequiredEnv(name));
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Environment variable ${name} must be a non-negative integer`);
  }

  return parsed;
};

const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");

const splitOrigins = (value) =>
  String(value || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

const parseDurationMsEnv = (name) => {
  const parsed = ms(readRequiredEnv(name));
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a valid duration string`);
  }

  return parsed;
};

const parseCookieSameSiteEnv = () => {
  const sameSite = readRequiredEnv("COOKIE_SAME_SITE").toLowerCase();
  if (!["lax", "strict", "none"].includes(sameSite)) {
    throw new Error("Environment variable COOKIE_SAME_SITE must be one of: lax, strict, none");
  }

  return sameSite;
};

module.exports = {
  nodeEnv: readRequiredEnv("NODE_ENV"),
  port: parsePositiveIntEnv("PORT"),
  jwtSecret: readRequiredEnv("JWT_SECRET"),
  jwtExpiresIn: readRequiredEnv("JWT_EXPIRES_IN"),
  jwtExpiresInMs: parseDurationMsEnv("JWT_EXPIRES_IN"),
  dbHost: readRequiredEnv("DB_HOST"),
  dbPort: parsePositiveIntEnv("DB_PORT"),
  dbUser: readRequiredEnv("DB_USER"),
  dbPassword: readRequiredEnv("DB_PASSWORD"),
  dbName: readRequiredEnv("DB_NAME"),
  dbWaitForConnections: parseBooleanEnv("DB_WAIT_FOR_CONNECTIONS"),
  dbConnectionLimit: parsePositiveIntEnv("DB_CONNECTION_LIMIT"),
  dbMaxIdle: parsePositiveIntEnv("DB_MAX_IDLE"),
  dbIdleTimeoutMs: parsePositiveIntEnv("DB_IDLE_TIMEOUT_MS"),
  dbQueueLimit: parseNonNegativeIntEnv("DB_QUEUE_LIMIT"),
  dbEnableKeepAlive: parseBooleanEnv("DB_ENABLE_KEEPALIVE"),
  dbKeepAliveInitialDelayMs: parseNonNegativeIntEnv("DB_KEEPALIVE_INITIAL_DELAY_MS"),
  corsAllowedOrigins: splitOrigins(process.env.CORS_ALLOWED_ORIGINS),
  frontendOrigins: splitOrigins(process.env.FRONTEND_ORIGIN),
  cookieSameSite: parseCookieSameSiteEnv(),
  cookieSecure: parseBooleanEnv("COOKIE_SECURE"),
  cookieDomain: readOptionalEnv("COOKIE_DOMAIN"),
  phaseFinalizerCronEnabled: parseBooleanEnv("PHASE_FINALIZER_CRON_ENABLED"),
  phaseFinalizerCron: readRequiredEnv("PHASE_FINALIZER_CRON"),
  holidayCacheTtlMs: Math.max(1000, parsePositiveIntEnv("HOLIDAY_CACHE_TTL_MS"))
};
