const service = require("./teamTarget.service");

const getTeamTargets = async (req, res) => {
  try {
    const rows = await service.getTeamTargets(req.query || {}, req.user);
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getTeamTargetByTeamId = async (req, res) => {
  try {
    const data = await service.getTeamTargetByTeamId(req.params.teamId, req.user);
    res.json(data);
  } catch (error) {
    const status = error.message === "Team not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const setTeamTarget = async (req, res) => {
  try {
    const data = await service.setTeamTarget(req.params.teamId, req.body || {}, req.user);
    res.json({
      message: "Team target saved successfully",
      data
    });
  } catch (error) {
    const status = error.message === "Team not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

module.exports = {
  getTeamTargets,
  getTeamTargetByTeamId,
  setTeamTarget
};
