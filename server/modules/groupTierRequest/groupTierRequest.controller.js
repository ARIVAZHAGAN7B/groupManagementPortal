const service = require("./groupTierRequest.service");
const auditService = require("../audit/audit.service");
const { broadcastGroupTierRequestChanged } = require("../../realtime/events");

const applyTierChangeRequest = async (req, res) => {
  try {
    const result = await service.applyGroupTierChangeRequest(req.user, req.body);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "GROUP_TIER_CHANGE_REQUEST_APPLIED",
      entityType: "GROUP_TIER_CHANGE_REQUEST",
      entityId: result?.tier_change_request_id || null,
      details: result
    });

    broadcastGroupTierRequestChanged({
      action: "GROUP_TIER_CHANGE_REQUEST_APPLIED",
      requestId: result?.tier_change_request_id || null,
      groupId: result?.group_id || req.body?.group_id || null,
      status: result?.status || "PENDING",
      requestedTier: result?.requested_tier || null
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const decideTierChangeRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, decision_reason } = req.body;

    const result = await service.decideGroupTierChangeRequest(
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
          ? "GROUP_TIER_CHANGE_REQUEST_APPROVED"
          : "GROUP_TIER_CHANGE_REQUEST_REJECTED",
      entityType: "GROUP_TIER_CHANGE_REQUEST",
      entityId: requestId,
      reasonCode: decision_reason,
      details: result
    });

    broadcastGroupTierRequestChanged({
      action:
        String(status).toUpperCase() === "APPROVED"
          ? "GROUP_TIER_CHANGE_REQUEST_APPROVED"
          : "GROUP_TIER_CHANGE_REQUEST_REJECTED",
      requestId: result?.tier_change_request_id || Number(requestId),
      groupId: result?.group_id || null,
      status: result?.status || String(status || "").toUpperCase(),
      appliedTier: result?.applied_tier || null
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllPendingTierChangeRequests = async (req, res) => {
  try {
    const data = await service.getAllPendingTierChangeRequests(req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPendingTierChangeRequestsByGroup = async (req, res) => {
  try {
    const data = await service.getPendingTierChangeRequestsByGroup(req.params.groupId, req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyTierChangeRequests = async (req, res) => {
  try {
    const data = await service.getMyTierChangeRequests(req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAdminTierChangeNotifications = async (req, res) => {
  try {
    const data = await service.getAdminTierRequestNotifications(req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  applyTierChangeRequest,
  decideTierChangeRequest,
  getAllPendingTierChangeRequests,
  getPendingTierChangeRequestsByGroup,
  getMyTierChangeRequests,
  getAdminTierChangeNotifications
};
