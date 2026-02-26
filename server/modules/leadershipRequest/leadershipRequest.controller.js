const service = require("./leadershipRequest.service");
const auditService = require("../audit/audit.service");

const applyLeadershipRoleRequest = async (req, res) => {
  try {
    const result = await service.applyLeadershipRoleRequest(req.user, req.body);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "LEADERSHIP_ROLE_REQUEST_APPLIED",
      entityType: "LEADERSHIP_ROLE_REQUEST",
      entityId: result?.leadership_request_id || null,
      details: {
        group_id: result?.group_id,
        student_id: result?.student_id,
        requested_role: result?.requested_role,
        leadership_alert_triggered: result?.leadership_alert_triggered
      }
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const decideLeadershipRoleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, decision_reason } = req.body;

    const result = await service.decideLeadershipRoleRequest(
      requestId,
      status,
      decision_reason,
      req.user
    );

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action:
        String(status).toUpperCase() === "APPROVED"
          ? "LEADERSHIP_ROLE_REQUEST_APPROVED"
          : "LEADERSHIP_ROLE_REQUEST_REJECTED",
      entityType: "LEADERSHIP_ROLE_REQUEST",
      entityId: requestId,
      reasonCode: decision_reason,
      details: result
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPendingLeadershipRequestsByGroup = async (req, res) => {
  try {
    const data = await service.getPendingLeadershipRequestsByGroup(req.params.groupId, req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllPendingLeadershipRequests = async (req, res) => {
  try {
    const data = await service.getAllPendingLeadershipRequests(req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyLeadershipRoleRequests = async (req, res) => {
  try {
    const data = await service.getMyLeadershipRoleRequests(req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAdminLeadershipNotifications = async (req, res) => {
  try {
    const data = await service.getAdminNotificationSummary(req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  applyLeadershipRoleRequest,
  decideLeadershipRoleRequest,
  getPendingLeadershipRequestsByGroup,
  getAllPendingLeadershipRequests,
  getMyLeadershipRoleRequests,
  getAdminLeadershipNotifications
};
