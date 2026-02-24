const service = require("./joinRequest.service");

exports.applyJoinRequest = async (req, res) => {
  try {
    const studentUserId = req.user.userId;
    const studentId = await service.getStudentIdByUserId(studentUserId);
    const { group_id } = req.body;

    const result = await service.applyJoinRequest(studentId, group_id);
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
