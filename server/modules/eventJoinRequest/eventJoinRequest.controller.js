const service = require("./eventJoinRequest.service");
const { broadcastEventJoinRequestChanged } = require("../../realtime/events");

const applyEventJoinRequest = async (req, res) => {
  try {
    const studentId = await service.getStudentIdByUserId(req.user.userId);
    const { team_id } = req.body;
    const result = await service.applyEventJoinRequest(studentId, team_id);

    await broadcastEventJoinRequestChanged({
      action: "EVENT_JOIN_REQUEST_APPLIED",
      requestId: result?.event_request_id || null,
      teamId: result?.team_id || team_id,
      studentId: result?.student_id || studentId,
      status: result?.status || "PENDING"
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const decideEventJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, decision_reason, approved_role } = req.body;
    const result = await service.decideEventJoinRequest(
      requestId,
      status,
      decision_reason,
      req.user,
      { approved_role }
    );

    await broadcastEventJoinRequestChanged({
      action:
        String(status || "").toUpperCase() === "APPROVED"
          ? "EVENT_JOIN_REQUEST_APPROVED"
          : "EVENT_JOIN_REQUEST_REJECTED",
      requestId: result?.event_request_id || Number(requestId),
      teamId: result?.team_id || null,
      studentId: result?.student_id || null,
      status: result?.status || String(status || "").toUpperCase(),
      approvedRole: result?.approved_role || null,
      membershipChanged: String(result?.status || status || "").toUpperCase() === "APPROVED"
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPendingRequestsByTeam = async (req, res) => {
  try {
    const data = await service.getPendingRequestsByTeam(req.params.teamId, req.user);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyEventJoinRequests = async (req, res) => {
  try {
    const studentId = await service.getStudentIdByUserId(req.user.userId);
    const data = await service.getMyEventJoinRequests(studentId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyEventJoinRequest,
  decideEventJoinRequest,
  getPendingRequestsByTeam,
  getMyEventJoinRequests
};
