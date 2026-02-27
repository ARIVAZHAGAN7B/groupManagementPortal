const repo = require("./membership.repository");
const db = require("../../config/db");
const phaseRepo = require("../phase/phase.repository");
const systemConfigService = require("../systemConfig/systemConfig.service");
const REJOIN_DEADLINE_HOURS = 24;
const REJOIN_DEADLINE_RULE = "NEXT_WORKING_DAY_END";

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

const formatDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US");
};

const addHours = (value, hours) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const nextWorkingDayDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const cursor = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (isWeekend(cursor)) {
    cursor.setDate(cursor.getDate() + 1);
  }

  return cursor;
};

const endOfLocalDay = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
};

const getRejoinDeadlineFromLeaveDate = (leaveDate) => {
  const nextWorkingDay = nextWorkingDayDate(leaveDate);
  if (!nextWorkingDay) return null;
  return endOfLocalDay(nextWorkingDay);
};

const getRejoinDeadlineInfo = async (studentId, options = {}) => {
  const latestLeft = await repo.findLatestLeftMembershipByStudent(studentId, options.executor);
  if (!latestLeft?.leave_date) {
    return {
      has_rejoin_deadline: false,
      rule: REJOIN_DEADLINE_RULE,
      deadline_hours: REJOIN_DEADLINE_HOURS,
      latest_left_membership_id: latestLeft?.membership_id || null,
      left_group_id: latestLeft?.group_id || null,
      left_at: null,
      rejoin_deadline_at: null,
      is_expired: false
    };
  }

  const leftAt = new Date(latestLeft.leave_date);
  const deadlineAt = getRejoinDeadlineFromLeaveDate(leftAt);
  const now = options.now ? new Date(options.now) : new Date();
  const expired =
    !Number.isNaN(now.getTime()) &&
    deadlineAt instanceof Date &&
    !Number.isNaN(deadlineAt.getTime()) &&
    now.getTime() > deadlineAt.getTime();

  return {
    has_rejoin_deadline: true,
    rule: REJOIN_DEADLINE_RULE,
    deadline_hours: REJOIN_DEADLINE_HOURS,
    latest_left_membership_id: latestLeft.membership_id,
    left_group_id: latestLeft.group_id,
    left_at: leftAt,
    rejoin_deadline_at: deadlineAt,
    is_expired: expired
  };
};

const ensureRejoinDeadlineCompliance = async (studentId, options = {}) => {
  const info = await getRejoinDeadlineInfo(studentId, options);
  if (!info.has_rejoin_deadline || !info.is_expired || options.allowExpired === true) {
    return info;
  }

  const leftText = formatDateTime(info.left_at) || "unknown";
  const deadlineText = formatDateTime(info.rejoin_deadline_at) || "unknown";

  throw new Error(
    `Join deadline expired. Student left group ${info.left_group_id} on ${leftText} and must join by the end of the next working day (${deadlineText}). Admin approval is required.`
  );
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

  await ensureRejoinDeadlineCompliance(student_id);

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

  const rejoinDeadlineAt = getRejoinDeadlineFromLeaveDate(new Date());

  return {
    memberCount: count,
    status,
    leave_deadline_days: 1,
    rejoin_deadline_rule: REJOIN_DEADLINE_RULE,
    rejoin_deadline_at:
      rejoinDeadlineAt && !Number.isNaN(rejoinDeadlineAt.getTime())
        ? rejoinDeadlineAt.toISOString()
        : null
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

const removeMembershipService = async (membershipId, actorUser) => {
  const membership = await repo.getMembershipById(membershipId);
  if (!membership) throw new Error("Membership not found");

  if (membership.status !== "ACTIVE") {
    throw new Error("Membership is already left");
  }

  let bypassChangeDay = false;

  if (!actorUser?.role || !actorUser?.userId) {
    throw new Error("Unauthorized");
  }

  if (ADMIN_ROLES.includes(String(actorUser.role).toUpperCase())) {
    bypassChangeDay = true;
  } else {
    if (String(actorUser.role).toUpperCase() !== "CAPTAIN") {
      throw new Error("Only admin or group captain can remove memberships");
    }

    const conn = await db.getConnection();
    try {
      await ensureActorCanUpdateRole(conn, actorUser, membership.group_id);

      const [studentRows] = await conn.query(
        "SELECT student_id FROM students WHERE user_id=? LIMIT 1",
        [actorUser.userId]
      );

      if (studentRows.length === 0) throw new Error("Student not found");

      const actorStudentId = studentRows[0].student_id;
      if (String(actorStudentId) === String(membership.student_id)) {
        throw new Error("Use Leave Group to leave your own membership");
      }
    } finally {
      conn.release();
    }
  }

  const leaveResult = await leaveGroupService(membership.student_id, membership.group_id, {
    bypassChangeDay
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
  REJOIN_DEADLINE_HOURS,
  REJOIN_DEADLINE_RULE,
  getRejoinDeadlineInfo,
  ensureRejoinDeadlineCompliance,
  joinGroupService,
  leaveGroupService,
  getMembersService,
  updateRoleService,
  getMyGroupService,
  getAllMembershipsService,
  adminLeaveMembershipService,
  removeMembershipService
};
