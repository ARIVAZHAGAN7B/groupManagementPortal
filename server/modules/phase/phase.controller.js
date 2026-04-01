const phaseService = require("./phase.service");
const auditService = require("../audit/audit.service");
const { broadcastEligibilityChanged, broadcastPhaseChanged } = require("../../realtime/events");

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

    broadcastPhaseChanged({
      action: "PHASE_CREATED",
      phaseId: phase?.phase_id || null,
      status: phase?.status || null
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

    broadcastPhaseChanged({
      action: "PHASE_TARGETS_UPDATED",
      phaseId: phase_id
    });
    broadcastEligibilityChanged({
      action: "PHASE_TARGETS_UPDATED",
      scope: "PHASE",
      phaseId: phase_id
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

const previewWorkingDays = async (req, res) => {
  try {
    const data = await phaseService.previewWorkingDays({
      start_date: req.query?.start_date,
      end_date: req.query?.end_date
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
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

const updatePhaseChangeDay = async (req, res) => {
  try {
    const { phase_id } = req.params;
    const { change_day } = req.body || {};
    const phase = await phaseService.updatePhaseChangeDay(phase_id, change_day);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "PHASE_CHANGE_DAY_UPDATED",
      entityType: "PHASE",
      entityId: phase_id,
      details: {
        change_day: phase?.change_day ?? null,
        change_day_number: phase?.change_day_number ?? null
      }
    });

    broadcastPhaseChanged({
      action: "PHASE_CHANGE_DAY_UPDATED",
      phaseId: phase_id,
      status: phase?.status || null
    });

    res.json({
      message: "Change day updated successfully",
      phase
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updatePhaseSettings = async (req, res) => {
  try {
    const { phase_id } = req.params;
    const { end_date, start_time, end_time } = req.body || {};
    const phase = await phaseService.updatePhaseSettings(phase_id, {
      end_date,
      start_time,
      end_time
    });

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "PHASE_SETTINGS_UPDATED",
      entityType: "PHASE",
      entityId: phase_id,
      details: {
        end_date: phase?.end_date ?? null,
        total_working_days: phase?.total_working_days ?? null,
        change_day_number: phase?.change_day_number ?? null,
        start_time: phase?.start_time ?? null,
        end_time: phase?.end_time ?? null
      }
    });

    broadcastPhaseChanged({
      action: "PHASE_SETTINGS_UPDATED",
      phaseId: phase_id,
      status: phase?.status || null
    });

    res.json({
      message: "Phase settings updated successfully",
      phase
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createPhase,
  setPhaseTargets,
  getPhaseTargets,
  getCurrentPhase,
  getAllPhases,
  previewWorkingDays,
  getPhaseById,
  isChangeDay,
  updatePhaseSettings,
  updatePhaseChangeDay
};
