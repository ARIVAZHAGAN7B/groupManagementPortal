const service = require("./joinRequest.service");
const auditService = require("../audit/audit.service");
const { broadcastJoinRequestChanged } = require("../../realtime/events");

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

    await broadcastJoinRequestChanged({
      action: "JOIN_REQUEST_APPLIED",
      requestId: result?.request_id || null,
      groupId: result?.group_id || group_id,
      studentId: result?.student_id || studentId,
      status: result?.status || "PENDING"
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.decideJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, decision_reason, approved_role } = req.body;

    const result = await service.decideJoinRequest(
      requestId,
      status,
      decision_reason,
      req.user,
      { approved_role }
    );

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: status === "APPROVED" ? "JOIN_REQUEST_APPROVED" : "JOIN_REQUEST_REJECTED",
      entityType: "JOIN_REQUEST",
      entityId: requestId,
      reasonCode: decision_reason || null,
      details: { status, decision_reason, approved_role: approved_role || null }
    });

    await broadcastJoinRequestChanged({
      action:
        String(status || "").toUpperCase() === "APPROVED"
          ? "JOIN_REQUEST_APPROVED"
          : "JOIN_REQUEST_REJECTED",
      requestId: result?.request_id || Number(requestId),
      groupId: result?.group_id || null,
      studentId: result?.student_id || null,
      status: result?.status || String(status || "").toUpperCase(),
      approvedRole: result?.approved_role || null,
      membershipChanged: String(result?.status || status || "").toUpperCase() === "APPROVED"
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
