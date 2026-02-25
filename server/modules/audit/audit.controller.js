const auditService = require("./audit.service");

const listAuditLogs = async (req, res) => {
  try {
    const data = await auditService.getAuditLogs(req.query || {});
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  listAuditLogs
};
