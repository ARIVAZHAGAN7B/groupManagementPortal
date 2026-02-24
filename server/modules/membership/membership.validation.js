const validateJoin = (req, res, next) => {
  const { groupId } = req.params;

  if (!groupId) {
    return res.status(400).json({ message: "groupId is required" });
  }

  next();
};

const validateRole = (req, res, next) => {
  const { role } = req.body;
  const roles = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER", "MEMBER"];

  if (!roles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  next();
};

module.exports = {
  validateJoin,
  validateRole
};
