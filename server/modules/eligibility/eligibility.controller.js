const eligibilityService = require("./eligibility.service");

const recordBasePoints = async (req, res) => {
  try {
    const result = await eligibilityService.recordBasePoints(req.body);
    res.status(201).json({
      message: "Base points recorded successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getStudentBasePoints = async (req, res) => {
  try {
    const { student_id } = req.params;
    const data = await eligibilityService.getStudentBasePoints(
      student_id,
      req.query.limit
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const evaluatePhaseEligibility = async (req, res) => {
  try {
    const result = await eligibilityService.evaluatePhaseEligibility(req.params.phase_id);
    res.json({
      message: "Eligibility evaluated successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getIndividualEligibility = async (req, res) => {
  try {
    const rows = await eligibilityService.getIndividualEligibility(
      req.params.phase_id,
      req.query
    );
    res.json(rows);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getGroupEligibility = async (req, res) => {
  try {
    const rows = await eligibilityService.getGroupEligibility(
      req.params.phase_id,
      req.query
    );
    res.json(rows);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyIndividualEligibility = async (req, res) => {
  try {
    const row = await eligibilityService.getMyIndividualEligibility(
      req.params.phase_id,
      req.user.userId
    );
    res.json(row);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyIndividualEligibilityHistory = async (req, res) => {
  try {
    const rows = await eligibilityService.getMyIndividualEligibilityHistory(
      req.user.userId
    );
    res.json(rows);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAdminStudentOverview = async (_req, res) => {
  try {
    const data = await eligibilityService.getAdminStudentOverview();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentLeaderboards = async (_req, res) => {
  try {
    const data = await eligibilityService.getStudentLeaderboards();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGroupEligibilitySummary = async (req, res) => {
  try {
    const data = await eligibilityService.getGroupEligibilitySummary(
      req.params.phase_id,
      req.params.group_id
    );
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyDashboardSummary = async (req, res) => {
  try {
    const data = await eligibilityService.getMyDashboardSummary(
      req.user.userId,
      req.user.name || null
    );
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  recordBasePoints,
  getStudentBasePoints,
  evaluatePhaseEligibility,
  getIndividualEligibility,
  getGroupEligibility,
  getMyIndividualEligibility,
  getMyIndividualEligibilityHistory,
  getAdminStudentOverview,
  getStudentLeaderboards,
  getGroupEligibilitySummary,
  getMyDashboardSummary
};
