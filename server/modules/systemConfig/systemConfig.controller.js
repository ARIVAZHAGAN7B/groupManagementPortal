const service = require("./systemConfig.service");
const auditService = require("../audit/audit.service");

const getPolicy = async (_req, res) => {
  try {
    const data = await service.getOperationalPolicy();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePolicy = async (req, res) => {
  try {
    const data = await service.updateOperationalPolicy(req.body || {});

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "SYSTEM_POLICY_UPDATED",
      entityType: "SYSTEM_CONFIG",
      entityId: "policy",
      details: data
    });

    res.json({
      message: "Operational policy updated",
      data
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getIncubation = async (_req, res) => {
  try {
    const data = await service.getIncubationConfig();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateIncubation = async (req, res) => {
  try {
    const data = await service.updateIncubationConfig(req.body || {});

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "INCUBATION_POLICY_UPDATED",
      entityType: "SYSTEM_CONFIG",
      entityId: "incubation",
      details: data
    });

    res.json({
      message: "Incubation settings updated",
      data
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPolicy,
  updatePolicy,
  getIncubation,
  updateIncubation
};
