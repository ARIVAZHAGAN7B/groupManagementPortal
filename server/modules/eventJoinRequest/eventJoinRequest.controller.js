const service = require("./eventJoinRequest.service");

const applyEventJoinRequest = async (req, res) => {
  try {
    const studentId = await service.getStudentIdByUserId(req.user.userId);
    const { team_id } = req.body;
    const result = await service.applyEventJoinRequest(studentId, team_id);
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
