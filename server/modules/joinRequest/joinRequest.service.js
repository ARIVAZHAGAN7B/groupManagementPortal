const repo = require("./joinRequest.repository");
const membershipRepo = require("../membership/membership.repository");
const db = require("../../config/db");
const systemConfigService = require("../systemConfig/systemConfig.service");

const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];
const resolveGroupStatusByCount = (count, policy) => {
  const min = Number(policy.min_group_members) || 9;
  const max = Number(policy.max_group_members) || 11;
  return count >= min && count <= max ? "ACTIVE" : "INACTIVE";
};

const getStudentIdByUserIdFrom = async (queryable, userId) => {
  const [rows] = await queryable.query(
    "SELECT student_id FROM students WHERE user_id=? LIMIT 1",
    [userId]
  );
  if (rows.length === 0) throw new Error("Student not found");
  return rows[0].student_id;
};

const getAdminIdByUserIdFrom = async (queryable, userId) => {
  const [rows] = await queryable.query(
    "SELECT admin_id FROM admins WHERE user_id=? LIMIT 1",
    [userId]
  );
  if (rows.length === 0) throw new Error("Admin not found");
  return rows[0].admin_id;
};

const ensureCaptainAccessByUserId = async (queryable, userId, groupId) => {
  const studentId = await getStudentIdByUserIdFrom(queryable, userId);
  const [rows] = await queryable.query(
    `SELECT membership_id
     FROM memberships
     WHERE student_id=? AND group_id=? AND status='ACTIVE' AND role='CAPTAIN'
     LIMIT 1`,
    [studentId, groupId]
  );

  if (rows.length === 0) {
    throw new Error("Only the group captain can manage join requests");
  }

  return studentId;
};

const resolveDecisionBy = async (queryable, actorUser, groupId) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");

  if (ADMIN_ROLES.includes(actorUser.role)) {
    return getAdminIdByUserIdFrom(queryable, actorUser.userId);
  }

  await ensureCaptainAccessByUserId(queryable, actorUser.userId, groupId);
  return null;
};

exports.applyJoinRequest = async (studentId, groupId) => {
  const policy = await systemConfigService.getOperationalPolicy();
  const active = await membershipRepo.findActiveMembershipByStudent(studentId);
  if (active.length > 0) throw new Error("Student already belongs to a group");

  const group = await repo.findGroupById(groupId);
  if (!group) throw new Error("Group not found");
  if (String(group.status || "").toUpperCase() === "FROZEN") {
    throw new Error("Cannot apply to a frozen group");
  }

  const count = await membershipRepo.countGroupMembers(groupId);
  if (count >= Number(policy.max_group_members)) {
    throw new Error("Group has no vacancies");
  }

  const existing = await repo.findPendingRequest(studentId, groupId);
  if (existing) throw new Error("Join request already exists");

  return repo.createJoinRequest(studentId, groupId);
};

exports.getStudentIdByUserId = async (userId) => {
  return getStudentIdByUserIdFrom(db, userId);
};

exports.getAdminIdByUserId = async (userId) => {
  return getAdminIdByUserIdFrom(db, userId);
};

exports.decideJoinRequest = async (requestId, status, reason, actorUser) => {
  const policy = await systemConfigService.getOperationalPolicy();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const request = await repo.findByIdTx(conn, requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "PENDING") throw new Error("Request already processed");

    const decisionBy = await resolveDecisionBy(conn, actorUser, request.group_id);
    await repo.updateDecisionTx(conn, requestId, status, reason, decisionBy);

    if (status === "APPROVED") {
      const [targetGroupRows] = await conn.query(
        "SELECT group_id, status FROM Sgroup WHERE group_id=? LIMIT 1 FOR UPDATE",
        [request.group_id]
      );
      const targetGroup = targetGroupRows[0];
      if (!targetGroup) {
        throw new Error("Group not found");
      }
      if (String(targetGroup.status || "").toUpperCase() === "FROZEN") {
        throw new Error("Cannot approve request for a frozen group");
      }

      const [activeRows] = await conn.query(
        "SELECT * FROM memberships WHERE student_id=? AND status='ACTIVE' LIMIT 1",
        [request.student_id]
      );
      if (activeRows.length > 0) {
        throw new Error("Student already belongs to a group");
      }

      const [[countBeforeRow]] = await conn.query(
        "SELECT COUNT(*) AS count FROM memberships WHERE group_id=? AND status='ACTIVE' FOR UPDATE",
        [request.group_id]
      );
      const countBefore = Number(countBeforeRow?.count) || 0;
      if (countBefore >= Number(policy.max_group_members)) {
        throw new Error("Group has no vacancies");
      }

      await conn.query(
        "INSERT INTO memberships (student_id, group_id, role, status, join_date) VALUES (?,?,?,?, NOW())",
        [request.student_id, request.group_id, "MEMBER", "ACTIVE"]
      );

      const [[row]] = await conn.query(
        "SELECT COUNT(*) AS count FROM memberships WHERE group_id=? AND status='ACTIVE'",
        [request.group_id]
      );
      const gStatus = resolveGroupStatusByCount(Number(row.count) || 0, policy);

      await conn.query("UPDATE Sgroup SET status=? WHERE group_id=?", [
        gStatus,
        request.group_id
      ]);
    }

    await conn.commit();
    return { message: `Request ${status} successfully` };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.getPendingRequestsByGroup = async (groupId, actorUser) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");

  if (!ADMIN_ROLES.includes(actorUser.role)) {
    await ensureCaptainAccessByUserId(db, actorUser.userId, groupId);
  }

  return repo.findPendingByGroup(groupId);
};

exports.getMyRequests = async (studentId) => repo.findByStudent(studentId);
