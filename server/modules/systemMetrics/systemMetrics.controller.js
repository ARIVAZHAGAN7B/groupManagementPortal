const service = require("./systemMetrics.service");

const getSystemMetricsSummary = async (_req, res) => {
  try {
    const data = await service.getSystemMetricsSummary();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error?.message || "Failed to load system metrics"
    });
  }
};

module.exports = {
  getSystemMetricsSummary
};
