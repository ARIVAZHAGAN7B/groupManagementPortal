const groupRepo = require("./group.repository");

exports.createGroup = async (groupData) => {
  if (!groupData.group_code || !groupData.group_name) {
    throw new Error("Group code and name required");
  }

  return await groupRepo.createGroup({
    ...groupData,
    status: groupData.status || "INACTIVE"
  });
};

exports.getGroups = async () => {
  return await groupRepo.getAllGroups();
};

exports.getGroup = async (id) => {
  return await groupRepo.getGroupById(id);
};

exports.updateGroup = async (id, data) => {
  return await groupRepo.updateGroup(id, data);
};

exports.deleteGroup = async (id) => {
  return await groupRepo.deleteGroup(id);
};

exports.activateGroup = async (id) => {
  return await groupRepo.activateGroup(id);
}

exports.freezeGroup = async (id) => {
  return await groupRepo.freezeGroup(id, { status: "FROZEN" });
}
