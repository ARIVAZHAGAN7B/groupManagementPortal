const service = require("../teamChangeTier/teamChangeTier.service");
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
      req.user,
      req.body || {}
    );

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "GROUP_TIER_CHANGE_APPLIED",
      entityType: "GROUP_TIER_CHANGE",
      entityId: `${req.params.phase_id}:${req.params.group_id}`,
      details: result
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPhaseWiseGroupTierChange = async (req, res) => {
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
  getPhaseWiseGroupTierChange
};
