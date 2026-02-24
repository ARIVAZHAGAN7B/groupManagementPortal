const groupService = require("./group.service");
const groupSwitchService = require("./groupSwitch.service");
exports.createGroup = async (req, res) => {
  try {
    const result = await groupService.createGroup(req.body);
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
    res.json({ message: "Group updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    await groupService.deleteGroup(req.params.id);
    res.json({ message: "Group deleted (soft)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.activateGroup = async (req, res) => {
  try {
    await groupService.activateGroup(req.params.id);
    res.json({ message: "Group activated" });
  }catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.freezeGroup = async (req, res) => {
  try {
    await groupService.freezeGroup(req.params.id);
    res.json({ message: "Group frozen" });
  }catch (err) {
    res.status(500).json({ error: err.message });
  };
};

exports.switchGroup = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { newGroupId } = req.body;

    const result = await groupSwitchService.switchGroup(studentId, newGroupId);
    res.json(result);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
