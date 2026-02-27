const eligibilityService = require("./eligibility.service");
const auditService = require("../audit/audit.service");

const recordBasePoints = async (req, res) => {
  try {
    const result = await eligibilityService.recordBasePoints(req.body);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "BASE_POINTS_RECORDED",
      entityType: "ELIGIBILITY",
      entityId: result?.history_id || req.body?.student_id,
      details: {
        student_id: req.body?.student_id,
        points: req.body?.points,
        reason: req.body?.reason,
        result
      }
    });

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

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "PHASE_ELIGIBILITY_EVALUATED",
      entityType: "PHASE",
      entityId: req.params.phase_id,
      details: result
    });

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

const overrideIndividualEligibility = async (req, res) => {
  try {
    const result = await eligibilityService.overrideIndividualEligibility(
      req.params.phase_id,
      req.params.student_id,
      req.body || {}
    );

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "INDIVIDUAL_ELIGIBILITY_OVERRIDDEN",
      entityType: "ELIGIBILITY",
      entityId: `${req.params.phase_id}:${req.params.student_id}`,
      reasonCode: req.body?.reason_code || null,
      details: result
    });

    res.json({
      message: "Individual eligibility overridden",
      data: result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const overrideGroupEligibility = async (req, res) => {
  try {
    const result = await eligibilityService.overrideGroupEligibility(
      req.params.phase_id,
      req.params.group_id,
      req.body || {}
    );

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "GROUP_ELIGIBILITY_OVERRIDDEN",
      entityType: "ELIGIBILITY",
      entityId: `${req.params.phase_id}:${req.params.group_id}`,
      reasonCode: req.body?.reason_code || null,
      details: result
    });

    res.json({
      message: "Group eligibility overridden",
      data: result
    });
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

const getStudentLeaderboards = async (req, res) => {
  try {
    const data = await eligibilityService.getStudentLeaderboards(req.query || {});
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
  overrideIndividualEligibility,
  overrideGroupEligibility,
  getMyIndividualEligibility,
  getMyIndividualEligibilityHistory,
  getAdminStudentOverview,
  getStudentLeaderboards,
  getGroupEligibilitySummary,
  getMyDashboardSummary
};
