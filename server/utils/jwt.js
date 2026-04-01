const jwt = require("jsonwebtoken");
const env = require("../config/env");

const SESSION_DURATION_MS = env.jwtExpiresInMs;
const SESSION_DURATION_HOURS = SESSION_DURATION_MS / (60 * 60 * 1000);
const SESSION_EXPIRES_IN = env.jwtExpiresIn;

const getSessionExpiresAt = (decodedToken) => {
  const expiryCandidates = [];

  if (typeof decodedToken?.iat === "number") {
    expiryCandidates.push(decodedToken.iat * 1000 + SESSION_DURATION_MS);
  }

  if (typeof decodedToken?.exp === "number") {
    expiryCandidates.push(decodedToken.exp * 1000);
  }

  if (!expiryCandidates.length) {
    return null;
  }

  return new Date(Math.min(...expiryCandidates)).toISOString();
};

const isSessionExpired = (decodedToken) => {
  const sessionExpiresAt = getSessionExpiresAt(decodedToken);

  if (!sessionExpiresAt) {
    return true;
  }

  return Date.parse(sessionExpiresAt) <= Date.now();
};

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.user_id, role: user.role, name: user.name },
    env.jwtSecret,
    { expiresIn: SESSION_EXPIRES_IN }
  );
};

const createAuthSession = (user) => {
  const token = generateToken(user);

  return {
    token,
    sessionExpiresAt: getSessionExpiresAt(jwt.decode(token))
  };
};

module.exports = {
  SESSION_DURATION_HOURS,
  SESSION_DURATION_MS,
  createAuthSession,
  generateToken,
  getSessionExpiresAt,
  isSessionExpired
};
