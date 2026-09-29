const service = require("./activityPointsWrite.service");

const getSyncLogs = async (req, res) => {
  try {
    const data = await service.listSyncLogs(req.query || {});
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getSyncLogs
};
