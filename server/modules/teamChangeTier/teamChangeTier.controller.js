const service = require("./teamChangeTier.service");
const auditService = require("../audit/audit.service");

const getPhaseTierChangePreview = async (req, res) => {
  try {
    const data = await service.getPhaseTierChangePreview(req.params.phase_id, req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const applyPhaseTierChange = async (req, res) => {
  try {
    const result = await service.applyPhaseTierChange(
      req.params.phase_id,
      req.params.group_id,
      req.user
    );

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "TEAM_CHANGE_TIER_APPLIED",
      entityType: "TEAM_CHANGE_TIER",
      entityId: `${req.params.phase_id}:${req.params.group_id}`,
      details: result
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPhaseWiseTeamChangeTier = async (req, res) => {
  try {
    const data = await service.getPhaseWiseTeamChangeTier(req.params.phase_id, req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPhaseTierChangePreview,
  applyPhaseTierChange,
  getPhaseWiseTeamChangeTier
};

