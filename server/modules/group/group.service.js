const groupRepo = require("./group.repository");
const systemConfigService = require("../systemConfig/systemConfig.service");

const addDiscoveryFields = (group, policy) => {
  if (!group) return group;

  const activeMemberCount =
    group.active_member_count === undefined || group.active_member_count === null
      ? null
      : Number(group.active_member_count);
  const maxMembers = Number(policy.max_group_members);
  const vacancies =
    activeMemberCount === null || Number.isNaN(maxMembers)
      ? null
      : Math.max(0, maxMembers - activeMemberCount);
  const status = String(group.status || "").toUpperCase();
  const acceptingApplications =
    status !== "FROZEN" && vacancies !== null ? vacancies > 0 : status !== "FROZEN";

  return {
    ...group,
    active_member_count: activeMemberCount,
    vacancies,
    accepting_applications: acceptingApplications
  };
};

exports.createGroup = async (groupData) => {
  if (!groupData.group_code || !groupData.group_name) {
    throw new Error("Group code and name required");
  }

  return await groupRepo.createGroup({
    ...groupData,
    tier: (groupData.tier || "D").toUpperCase(),
    status: groupData.status || "INACTIVE"
  });
};

exports.getGroups = async () => {
  const [groups, policy] = await Promise.all([
    groupRepo.getAllGroups(),
    systemConfigService.getOperationalPolicy()
  ]);
  return (groups || []).map((group) => addDiscoveryFields(group, policy));
};

exports.getGroup = async (id) => {
  const [group, policy] = await Promise.all([
    groupRepo.getGroupById(id),
    systemConfigService.getOperationalPolicy()
  ]);
  return addDiscoveryFields(group, policy);
};

exports.updateGroup = async (id, data) => {
  return await groupRepo.updateGroup(id, data);
};

exports.deleteGroup = async (id) => {
  return await groupRepo.deleteGroup(id);
};

exports.activateGroup = async (id, options = {}) => {
  const force = Boolean(options.force);
  const policy = await systemConfigService.getOperationalPolicy();
  const snapshot = await groupRepo.getGroupActivationSnapshot(id);

  if (!snapshot) {
    throw new Error("Group not found");
  }

  const memberCount = Number(snapshot.active_member_count) || 0;
  const min = Number(policy.min_group_members);
  const max = Number(policy.max_group_members);
  const leadershipFilled =
    Number(snapshot.captain_count) > 0 &&
    Number(snapshot.vice_captain_count) > 0 &&
    Number(snapshot.strategist_count) > 0 &&
    Number(snapshot.manager_count) > 0;

  if (!force) {
    if (memberCount < min || memberCount > max) {
      throw new Error(
        `Group can be activated only when active member count is between ${min} and ${max}`
      );
    }

    if (policy.require_leadership_for_activation && !leadershipFilled) {
      throw new Error(
        "Group can be activated only after CAPTAIN, VICE_CAPTAIN, STRATEGIST and MANAGER roles are filled (or admin overrides)"
      );
    }
  }

  await groupRepo.activateGroup(id);
  return {
    group_id: Number(id),
    activated: true,
    override_used: force,
    policy_snapshot: {
      min_group_members: min,
      max_group_members: max,
      require_leadership_for_activation: policy.require_leadership_for_activation
    },
    current_snapshot: {
      active_member_count: memberCount,
      leadership_filled: leadershipFilled
    }
  };
};

exports.freezeGroup = async (id) => {
  return await groupRepo.freezeGroup(id, { status: "FROZEN" });
};
