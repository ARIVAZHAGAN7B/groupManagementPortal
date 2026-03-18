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

const listHolidays = async (_req, res) => {
  try {
    const data = await service.listHolidays();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHolidayById = async (req, res) => {
  try {
    const data = await service.getHolidayById(req.params.id);
    res.json(data);
  } catch (error) {
    const status = error.message === "Holiday not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const createHoliday = async (req, res) => {
  try {
    const data = await service.createHoliday(req.body || {});

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "HOLIDAY_CREATED",
      entityType: "HOLIDAY",
      entityId: data.holiday_id,
      details: data
    });

    res.status(201).json({
      message: "Holiday created",
      data
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateHoliday = async (req, res) => {
  try {
    const data = await service.updateHoliday(req.params.id, req.body || {});

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "HOLIDAY_UPDATED",
      entityType: "HOLIDAY",
      entityId: data.holiday_id,
      details: data
    });

    res.json({
      message: "Holiday updated",
      data
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const data = await service.deleteHoliday(req.params.id);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "HOLIDAY_DELETED",
      entityType: "HOLIDAY",
      entityId: data.holiday_id,
      details: data
    });

    res.json({
      message: "Holiday deleted",
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
  updateIncubation,
  listHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday
};
