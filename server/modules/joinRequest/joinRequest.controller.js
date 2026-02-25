const service = require("./joinRequest.service");
const auditService = require("../audit/audit.service");

exports.applyJoinRequest = async (req, res) => {
  try {
    const studentUserId = req.user.userId;
    const studentId = await service.getStudentIdByUserId(studentUserId);
    const { group_id } = req.body;

    const result = await service.applyJoinRequest(studentId, group_id);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "JOIN_REQUEST_APPLIED",
      entityType: "JOIN_REQUEST",
      entityId: result?.request_id || `${studentId}:${group_id}`,
      details: {
        request_id: result?.request_id,
        student_id: studentId,
        group_id
      }
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.decideJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, decision_reason } = req.body;

    const result = await service.decideJoinRequest(
      requestId,
      status,
      decision_reason,
      req.user
    );

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: status === "APPROVED" ? "JOIN_REQUEST_APPROVED" : "JOIN_REQUEST_REJECTED",
      entityType: "JOIN_REQUEST",
      entityId: requestId,
      reasonCode: decision_reason || null,
      details: { status, decision_reason }
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getPendingRequestsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const data = await service.getPendingRequestsByGroup(groupId, req.user);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const studentUserId = req.user.userId;
    const studentId = await service.getStudentIdByUserId(studentUserId);
    const data = await service.getMyRequests(studentId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentIdByUserId = async (req, res) => {
  try {
    const studentUserId = req.user.userId;
    const studentId = await service.getStudentIdByUserId(studentUserId);
    res.json({ student_id: studentId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAdminIdByUserId = async (req, res) => {
  try {
    const adminUserId = req.user.userId;
    const adminId = await service.getAdminIdByUserId(adminUserId);
    res.json({ admin_id: adminId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
