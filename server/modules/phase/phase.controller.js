const phaseService = require("./phase.service");
const auditService = require("../audit/audit.service");

const createPhase = async (req, res) => {
  try {
    const phase = await phaseService.createPhase(req.body);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "PHASE_CREATED",
      entityType: "PHASE",
      entityId: phase?.phase_id,
      details: phase
    });

    res.status(201).json({ message: "Phase created", phase });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const setPhaseTargets = async (req, res) => {
  try {
    const { phase_id } = req.params;
    const { targets, individual_target } = req.body;

    await phaseService.setPhaseTargets(phase_id, targets, individual_target);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "PHASE_TARGETS_UPDATED",
      entityType: "PHASE",
      entityId: phase_id,
      details: {
        targets,
        individual_target
      }
    });

    res.json({ message: "Targets configured successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPhaseTargets = async (req, res) => {
  try {
    const data = await phaseService.getPhaseTargets(req.params.phase_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCurrentPhase = async (req, res) => {
  try {
    const phase = await phaseService.getCurrentPhase();
    res.json(phase || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllPhases = async (_req, res) => {
  try {
    const phases = await phaseService.getAllPhases();
    res.json(Array.isArray(phases) ? phases : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPhaseById = async (req, res) => {
  try {
    const phase = await phaseService.getPhaseById(req.params.phase_id);
    if (!phase) {
      return res.status(404).json({ error: "Phase not found" });
    }
    res.json(phase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const isChangeDay = async (req, res) => {
  try {
    const result = await phaseService.isChangeDay(req.params.phase_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createPhase,
  setPhaseTargets,
  getPhaseTargets,
  getCurrentPhase,
  getAllPhases,
  getPhaseById,
  isChangeDay
};
