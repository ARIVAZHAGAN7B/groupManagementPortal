const service = require("./groupPoint.service");
const auditService = require("../audit/audit.service");
const { broadcastEligibilityChanged, broadcastPointsChanged } = require("../../realtime/events");

const recordGroupPoint = async (req, res) => {
  try {
    const data = await service.recordGroupPoint(req.body || {});

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "GROUP_POINTS_RECORDED",
      entityType: "GROUP_POINT",
      entityId: data?.group_point_id || null,
      details: data
    });

    broadcastPointsChanged({
      action: "GROUP_POINTS_RECORDED",
      studentId: data?.student_id || req.body?.student_id || null,
      groupId: data?.group_id || req.body?.group_id || null,
      membershipId: data?.membership_id || req.body?.membership_id || null,
      groupPointId: data?.group_point_id || null
    });
    broadcastEligibilityChanged({
      action: "GROUP_POINTS_RECORDED",
      scope: "GROUP",
      studentId: data?.student_id || req.body?.student_id || null,
      groupId: data?.group_id || req.body?.group_id || null
    });

    res.status(201).json({
      message: "Group points recorded successfully",
      data
    });
  } catch (error) {
    const status =
      error.message === "Membership not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const getGroupPointById = async (req, res) => {
  try {
    const data = await service.getGroupPointById(req.params.groupPointId);
    res.json(data);
  } catch (error) {
    const status = error.message === "Group point not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const listGroupPoints = async (req, res) => {
  try {
    const data = await service.getGroupPoints(req.query || {});
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getGroupPointTotal = async (req, res) => {
  try {
    const data = await service.getGroupPointTotal(req.query || {});
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });/*  */
  }
};

module.exports = {
  recordGroupPoint,
  getGroupPointById,
  listGroupPoints,
  getGroupPointTotal
};
