const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");

const splitOrigins = (value) =>
  String(value || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

const toBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const getAllowedOrigins = () => {
  const configuredOrigins = [
    ...splitOrigins(process.env.CORS_ALLOWED_ORIGINS),
    ...splitOrigins(process.env.FRONTEND_ORIGIN)
  ];

  if (configuredOrigins.length > 0) {
    return Array.from(new Set(configuredOrigins));
  }

  return ["http://localhost:5173", "http://localhost:8080"];
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(normalizeOrigin(origin));
};

const createCorsOriginResolver = () => (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`Origin ${origin} is not allowed by CORS`));
};

const getCorsConfig = () => ({
  origin: createCorsOriginResolver(),
  credentials: true
});

const getCookieOptions = () => {
  const requestedSameSite = String(process.env.COOKIE_SAME_SITE || "strict")
    .trim()
    .toLowerCase();
  const sameSite = ["lax", "strict", "none"].includes(requestedSameSite)
    ? requestedSameSite
    : "strict";
  const secure = toBoolean(
    process.env.COOKIE_SECURE,
    String(process.env.NODE_ENV || "").toLowerCase() === "production" || sameSite === "none"
  );
  const cookieDomain = String(process.env.COOKIE_DOMAIN || "").trim();

  return {
    httpOnly: true,
    secure,
    sameSite,
    ...(cookieDomain ? { domain: cookieDomain } : {})
  };
};

module.exports = {
  createCorsOriginResolver,
  getAllowedOrigins,
  getCookieOptions,
  getCorsConfig
};
