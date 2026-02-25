const repo = require("./membership.repository");
const db = require("../../config/db");
const phaseRepo = require("../phase/phase.repository");
const systemConfigService = require("../systemConfig/systemConfig.service");

const toDateOnly = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
};

const resolveGroupStatusByCount = (count, policy) => {
  const min = Number(policy.min_group_members) || 9;
  const max = Number(policy.max_group_members) || 11;
  return count >= min && count <= max ? "ACTIVE" : "INACTIVE";
};

const ensureChangeDayLeaveAllowed = async (policy, options = {}) => {
  if (options.bypassChangeDay) return;
  if (!policy.enforce_change_day_for_leave) return;

  const phase = await phaseRepo.getCurrentPhase();
  if (!phase) {
    throw new Error("No active phase found. Leave is allowed only on Change Day.");
  }

  const today = toDateOnly(new Date());
  const changeDay = toDateOnly(phase.change_day);

  if (!today || !changeDay || today !== changeDay) {
    throw new Error("Leave is allowed only on Change Day");
  }
};

const joinGroupService = async (student_id, groupId, role) => {
  const policy = await systemConfigService.getOperationalPolicy();
  const existing = await repo.findActiveMembershipByStudent(student_id);

  if (existing.length > 0) {
    throw new Error("Student already belongs to a group");
  }

  const [groupRows] = await db.query(
    "SELECT group_id, status FROM Sgroup WHERE group_id=? LIMIT 1",
    [groupId]
  );
  const group = groupRows[0];
  if (!group) {
    throw new Error("Group not found");
  }
  if (String(group.status || "").toUpperCase() === "FROZEN") {
    throw new Error("Cannot join a frozen group");
  }

  const currentCount = await repo.countGroupMembers(groupId);
  if (currentCount >= Number(policy.max_group_members)) {
    throw new Error("Group is full");
  }

  await repo.createMembership(student_id, groupId, role);

  const count = await repo.countGroupMembers(groupId);

  const status = resolveGroupStatusByCount(count, policy);
  await repo.updateGroupStatus(groupId, status);

  return { memberCount: count, status };
};

const leaveGroupService = async (studentId, groupId, options = {}) => {
  const policy = await systemConfigService.getOperationalPolicy();
  await ensureChangeDayLeaveAllowed(policy, options);

  const membership = await repo.findActiveMembershipByStudentAndGroup(studentId, groupId);
  if (!membership) throw new Error("Active membership not found");

  await repo.leaveMembershipByStudentAndGroup(studentId, groupId);

  const count = await repo.countGroupMembers(groupId);
  const status = resolveGroupStatusByCount(count, policy);
  await repo.updateGroupStatus(groupId, status);

  return {
    memberCount: count,
    status,
    leave_deadline_days: 1
  };
};


const getMembersService = async (groupId) => {
  return repo.getGroupMembers(groupId);
};

const VALID_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER", "MEMBER"];
const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];

const ensureActorCanUpdateRole = async (conn, actorUser, groupId) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");

  if (ADMIN_ROLES.includes(actorUser.role)) {
    const [adminRows] = await conn.query(
      "SELECT admin_id FROM admins WHERE user_id=? LIMIT 1",
      [actorUser.userId]
    );
    if (adminRows.length === 0) throw new Error("Admin not found");
    return;
  }

  const [studentRows] = await conn.query(
    "SELECT student_id FROM students WHERE user_id=? LIMIT 1",
    [actorUser.userId]
  );
  if (studentRows.length === 0) throw new Error("Student not found");

  const studentId = studentRows[0].student_id;
  const [captainRows] = await conn.query(
    `SELECT membership_id
     FROM memberships
     WHERE student_id=? AND group_id=? AND status='ACTIVE' AND role='CAPTAIN'
     LIMIT 1`,
    [studentId, groupId]
  );

  if (captainRows.length === 0) {
    throw new Error("Only the group captain can modify member roles");
  }
};

const updateRoleService = async (membershipId, newRole, actorUser) => {
  if (!VALID_ROLES.includes(newRole)) throw new Error("Invalid role");

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mRows] = await conn.query(
      "SELECT * FROM memberships WHERE membership_id=? FOR UPDATE",
      [membershipId]
    );
    const membership = mRows[0];
    if (!membership) throw new Error("Membership not found");
    if (membership.status !== "ACTIVE") throw new Error("Only ACTIVE membership can be updated");

    await ensureActorCanUpdateRole(conn, actorUser, membership.group_id);

    // If setting CAPTAIN -> ensure only one captain per group
    if (newRole === "CAPTAIN") {
      const [capRows] = await conn.query(
        "SELECT membership_id FROM memberships WHERE group_id=? AND role='CAPTAIN' AND status='ACTIVE' FOR UPDATE",
        [membership.group_id]
      );

      if (capRows.length > 0 && capRows[0].membership_id !== membership.membership_id) {
        throw new Error("This group already has a CAPTAIN");
      }
    }

    await conn.query(
      "UPDATE memberships SET role=? WHERE membership_id=?",
      [newRole, membershipId]
    );

    await conn.commit();
    return { message: "Role updated successfully" };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const getMyGroupService = async (studentId) => {
  return repo.getActiveMembershipWithGroupByStudent(studentId);
};

const getAllMembershipsService = async () => {
  return repo.getAllMemberships();
};

const adminLeaveMembershipService = async (membershipId) => {
  const membership = await repo.getMembershipById(membershipId);
  if (!membership) throw new Error("Membership not found");

  if (membership.status !== "ACTIVE") {
    throw new Error("Membership is already left");
  }

  // Reuse the same leave flow as student self-leave so both paths stay consistent.
  const leaveResult = await leaveGroupService(membership.student_id, membership.group_id, {
    bypassChangeDay: true
  });

  return {
    membership_id: membershipId,
    student_id: membership.student_id,
    group_id: membership.group_id,
    membership_status: "LEFT",
    group_status: leaveResult.status
  };
};

module.exports = {
  joinGroupService,
  leaveGroupService,
  getMembersService,
  updateRoleService,
  getMyGroupService,
  getAllMembershipsService,
  adminLeaveMembershipService
};
