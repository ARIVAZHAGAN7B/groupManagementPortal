const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { isSessionExpired } = require("../utils/jwt");

const authenticate = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (isSessionExpired(decoded)) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = decoded; // { userId, role }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authenticate };
