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

const validateRemoveMembership = (req, res, next) => {
  const reason = String(req.body?.reason || "").trim();

  if (!reason) {
    return res.status(400).json({ message: "Removal reason is required" });
  }

  if (reason.length > 500) {
    return res.status(400).json({ message: "Removal reason must be 500 characters or fewer" });
  }

  next();
};

module.exports = {
  validateJoin,
  validateRole,
  validateRemoveMembership
};
