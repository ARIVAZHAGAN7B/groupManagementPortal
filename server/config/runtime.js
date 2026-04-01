const env = require("./env");

const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");

const getAllowedOrigins = () => {
  const configuredOrigins = [
    ...env.corsAllowedOrigins,
    ...env.frontendOrigins
  ];

  if (configuredOrigins.length > 0) {
    return Array.from(new Set(configuredOrigins));
  }

  throw new Error("Set CORS_ALLOWED_ORIGINS or FRONTEND_ORIGIN in the environment");
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
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    ...(env.cookieDomain ? { domain: env.cookieDomain } : {})
  };
};

module.exports = {
  createCorsOriginResolver,
  getAllowedOrigins,
  getCookieOptions,
  getCorsConfig
};
