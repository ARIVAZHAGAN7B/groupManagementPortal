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

const validateRank = (req, res, next) => {
  const rank = Number(req.body?.rank);

  if (!Number.isInteger(rank) || rank < 1 || rank > 5) {
    return res.status(400).json({ message: "Rank must be an integer between 1 and 5" });
  }

  req.body.rank = rank;
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
  validateRank,
  validateRemoveMembership
};
