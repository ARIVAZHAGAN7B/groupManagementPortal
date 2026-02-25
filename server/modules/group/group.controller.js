const groupService = require("./group.service");
const groupSwitchService = require("./groupSwitch.service");
const joinRequestService = require("../joinRequest/joinRequest.service");
const systemConfigService = require("../systemConfig/systemConfig.service");
const auditService = require("../audit/audit.service");
exports.createGroup = async (req, res) => {
  try {
    if (["STUDENT", "CAPTAIN"].includes(String(req.user?.role || "").toUpperCase())) {
      const policy = await systemConfigService.getOperationalPolicy();
      if (!policy.allow_student_group_creation) {
        return res.status(403).json({
          error: "Student group creation is disabled by policy"
        });
      }
    }

    const result = await groupService.createGroup(req.body);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "GROUP_CREATED",
      entityType: "GROUP",
      entityId: result.insertId,
      details: {
        group_code: req.body?.group_code,
        group_name: req.body?.group_name,
        tier: req.body?.tier || "D"
      }
    });

    res.status(201).json({
      message: "Group created successfully",
      id: result.insertId
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await groupService.getGroups();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroup = async (req, res) => {
  try {
    const group = await groupService.getGroup(req.params.id);
    if (!group) return res.status(404).json({ message: "Not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    await groupService.updateGroup(req.params.id, req.body);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "GROUP_UPDATED",
      entityType: "GROUP",
      entityId: req.params.id,
      details: req.body || null
    });

    res.json({ message: "Group updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    await groupService.deleteGroup(req.params.id);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "GROUP_SOFT_DELETED",
      entityType: "GROUP",
      entityId: req.params.id
    });

    res.json({ message: "Group deleted (soft)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.activateGroup = async (req, res) => {
  try {
    const result = await groupService.activateGroup(req.params.id, {
      force: req.body?.force === true
    });

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: result.override_used ? "GROUP_ACTIVATED_OVERRIDE" : "GROUP_ACTIVATED",
      entityType: "GROUP",
      entityId: req.params.id,
      details: result
    });

    res.json({ message: "Group activated", data: result });
  }catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.freezeGroup = async (req, res) => {
  try {
    await groupService.freezeGroup(req.params.id);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "GROUP_FROZEN",
      entityType: "GROUP",
      entityId: req.params.id
    });

    res.json({ message: "Group frozen" });
  }catch (err) {
    res.status(500).json({ error: err.message });
  };
};

exports.switchGroup = async (req, res) => {
  try {
    const studentUserId = req.user.userId;
    const studentId = await joinRequestService.getStudentIdByUserId(studentUserId);
    const { newGroupId } = req.body;

    const result = await groupSwitchService.switchGroup(studentId, newGroupId);

    await auditService.logActionSafe({
      req,
      actorUser: req.user,
      action: "GROUP_SWITCHED",
      entityType: "MEMBERSHIP",
      entityId: result?.membership_id || studentId,
      details: result
    });

    res.json(result);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
