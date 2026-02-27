const service = require("./membership.service");
const joinService = require("../joinRequest/joinRequest.service");
const auditService = require("../audit/audit.service");
const joinGroup = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const student_id = await joinService.getStudentIdByUserId(studentId);
    const { groupId } = req.params;
    const { role } = req.body;

    const result = await service.joinGroupService(student_id, groupId, role);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "MEMBERSHIP_JOINED",
      entityType: "MEMBERSHIP",
      entityId: `${student_id}:${groupId}`,
      details: {
        student_id,
        group_id: Number(groupId),
        role: role || "MEMBER",
        result
      }
    });

    res.json({
      message: "Joined group successfully",
      data: result
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const studentUserId = req.user.userId;
    const student_id = await joinService.getStudentIdByUserId(studentUserId);
    const { groupId } = req.body;

    if (!groupId) return res.status(400).json({ message: "groupId is required" });

    const result = await service.leaveGroupService(student_id, groupId);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "MEMBERSHIP_LEFT",
      entityType: "MEMBERSHIP",
      entityId: `${student_id}:${groupId}`,
      details: {
        student_id,
        group_id: Number(groupId),
        result
      }
    });

    res.json({ message: "Left group successfully", data: result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await service.getMembersService(groupId);
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const { role } = req.body;

    const result = await service.updateRoleService(membershipId, role, req.user);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "MEMBERSHIP_ROLE_UPDATED",
      entityType: "MEMBERSHIP",
      entityId: membershipId,
      details: { role }
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getMyGroup = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const student_id = await joinService.getStudentIdByUserId(studentId);
    const group = await service.getMyGroupService(student_id);
    const rejoinDeadlineInfo = group
      ? null
      : await service.getRejoinDeadlineInfo(student_id);
    if (!group) {
      return res.status(200).json({
        group: null,
        rejoin_deadline: rejoinDeadlineInfo
          ? {
              ...rejoinDeadlineInfo,
              left_at: rejoinDeadlineInfo.left_at
                ? new Date(rejoinDeadlineInfo.left_at).toISOString()
                : null,
              rejoin_deadline_at: rejoinDeadlineInfo.rejoin_deadline_at
                ? new Date(rejoinDeadlineInfo.rejoin_deadline_at).toISOString()
                : null
            }
          : null
      });
    }
    return res.json({ group, rejoin_deadline: null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllMemberships = async (_req, res) => {
  try {
    const rows = await service.getAllMembershipsService();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminLeaveMembership = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const result = await service.removeMembershipService(membershipId, req.user);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "MEMBERSHIP_REMOVED",
      entityType: "MEMBERSHIP",
      entityId: membershipId,
      details: result
    });

    res.json({
      message: "Membership marked as left",
      data: result
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


module.exports = {
  joinGroup,
  leaveGroup,
  getGroupMembers,
  updateRole,
  getMyGroup,
  getAllMemberships,
  adminLeaveMembership
};
