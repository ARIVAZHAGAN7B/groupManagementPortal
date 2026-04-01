const service = require("./membership.service");
const joinService = require("../joinRequest/joinRequest.service");
const auditService = require("../audit/audit.service");
const { broadcastMembershipChanged } = require("../../realtime/events");
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

    await broadcastMembershipChanged({
      action: "MEMBERSHIP_JOINED",
      studentId: result?.student_id || student_id,
      groupId: result?.group_id || Number(groupId),
      role: result?.role || role || "MEMBER",
      membershipStatus: result?.membership_status || "ACTIVE"
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

    await broadcastMembershipChanged({
      action: "MEMBERSHIP_LEFT",
      studentId: result?.student_id || student_id,
      groupId: result?.group_id || Number(groupId),
      membershipStatus: result?.membership_status || "LEFT"
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

    await broadcastMembershipChanged({
      action: "MEMBERSHIP_ROLE_UPDATED",
      studentId: result?.student_id || null,
      groupId: result?.group_id || null,
      membershipId: result?.membership_id || Number(membershipId),
      role: result?.role || role
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

const getGroupRankHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const rows = await service.getGroupRankHistoryService(groupId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getGroupRankRules = async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await service.getGroupRankRulesService(groupId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRank = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const { rank } = req.body;

    const result = await service.updateRankService(membershipId, rank, req.user);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "MEMBERSHIP_RANK_UPDATED",
      entityType: "MEMBERSHIP",
      entityId: membershipId,
      details: { rank }
    });

    await broadcastMembershipChanged({
      action: "MEMBERSHIP_RANK_UPDATED",
      studentId: result?.student_id || null,
      groupId: result?.group_id || null,
      membershipId: result?.membership_id || Number(membershipId),
      rank: result?.rank || rank
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateGroupRankRules = async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await service.updateGroupRankRulesService(groupId, req.body, req.user);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "GROUP_RANK_RULES_UPDATED",
      entityType: "GROUP_RANK_RULES",
      entityId: groupId,
      details: {
        use_system_default: Boolean(req.body?.use_system_default),
        rules: req.body?.rules || null
      }
    });

    await broadcastMembershipChanged({
      action: "GROUP_RANK_RULES_UPDATED",
      groupId: result?.group_id || Number(groupId)
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getAllMemberships = async (req, res) => {
  try {
    const data = await service.getAllMembershipsService(req.query || {});
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminLeaveMembership = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const reason = String(req.body?.reason || "").trim();
    const result = await service.removeMembershipService(membershipId, req.user, reason);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "MEMBERSHIP_REMOVED",
      entityType: "MEMBERSHIP",
      entityId: membershipId,
      reasonCode: "GROUP_MEMBER_REMOVAL",
      details: {
        ...result,
        removal_reason: reason
      }
    });

    await broadcastMembershipChanged({
      action: "MEMBERSHIP_REMOVED",
      studentId: result?.student_id || null,
      groupId: result?.group_id || null,
      membershipId: result?.membership_id || Number(membershipId),
      membershipStatus: result?.membership_status || "LEFT"
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
  getGroupRankHistory,
  getGroupRankRules,
  updateRole,
  updateRank,
  updateGroupRankRules,
  getMyGroup,
  getAllMemberships,
  adminLeaveMembership
};
