const repo = require("./joinRequest.repository");
const membershipRepo = require("../membership/membership.repository");
const db = require("../../config/db");
const systemConfigService = require("../systemConfig/systemConfig.service");

const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];
const VALID_MEMBERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER", "MEMBER"];
const LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];
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

const normalizeApprovedRole = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const role = String(value).trim().toUpperCase();
  if (!VALID_MEMBERSHIP_ROLES.includes(role)) {
    throw new Error("Invalid approved_role");
  }
  return role;
};

const getLeadershipSnapshotTx = async (conn, groupId) => {
  const [rows] = await conn.query(
    `SELECT
       SUM(CASE WHEN status='ACTIVE' AND role='CAPTAIN' THEN 1 ELSE 0 END) AS captain_count,
       SUM(CASE WHEN status='ACTIVE' AND role='VICE_CAPTAIN' THEN 1 ELSE 0 END) AS vice_captain_count,
       SUM(CASE WHEN status='ACTIVE' AND role='STRATEGIST' THEN 1 ELSE 0 END) AS strategist_count,
       SUM(CASE WHEN status='ACTIVE' AND role='MANAGER' THEN 1 ELSE 0 END) AS manager_count
     FROM memberships
     WHERE group_id=?
     FOR UPDATE`,
    [groupId]
  );

  const row = rows[0] || {};
  const snapshot = {
    captain_count: Number(row.captain_count) || 0,
    vice_captain_count: Number(row.vice_captain_count) || 0,
    strategist_count: Number(row.strategist_count) || 0,
    manager_count: Number(row.manager_count) || 0
  };

  return {
    ...snapshot,
    all_leadership_roles_empty:
      snapshot.captain_count === 0 &&
      snapshot.vice_captain_count === 0 &&
      snapshot.strategist_count === 0 &&
      snapshot.manager_count === 0
  };
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

exports.decideJoinRequest = async (requestId, status, reason, actorUser, options = {}) => {
  const policy = await systemConfigService.getOperationalPolicy();
  const actorRole = String(actorUser?.role || "").toUpperCase();
  const actorIsAdmin = ADMIN_ROLES.includes(actorRole);
  const approvedRole = normalizeApprovedRole(options?.approved_role);

  if (approvedRole && status !== "APPROVED") {
    throw new Error("approved_role can be used only when status is APPROVED");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let approvalMeta = null;

    const request = await repo.findByIdTx(conn, requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "PENDING") throw new Error("Request already processed");

    const decisionBy = await resolveDecisionBy(conn, actorUser, request.group_id);
    await repo.updateDecisionTx(conn, requestId, status, reason, decisionBy);

    if (status === "APPROVED") {
      const membershipRole = approvedRole || "MEMBER";

      if (LEADERSHIP_ROLES.includes(membershipRole) && !actorIsAdmin) {
        throw new Error("Only admin can approve join requests with leadership roles");
      }

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

      let leadershipSnapshot = {
        all_leadership_roles_empty: false
      };

      if (LEADERSHIP_ROLES.includes(membershipRole)) {
        leadershipSnapshot = await getLeadershipSnapshotTx(conn, request.group_id);
        const [sameRoleRows] = await conn.query(
          `SELECT membership_id
           FROM memberships
           WHERE group_id=? AND status='ACTIVE' AND role=?
           LIMIT 1
           FOR UPDATE`,
          [request.group_id, membershipRole]
        );
        if (sameRoleRows.length > 0) {
          throw new Error(`Group already has an active ${membershipRole}`);
        }
      }

      approvalMeta = {
        approved_role: membershipRole,
        all_leadership_roles_empty_before_approval: Boolean(
          leadershipSnapshot.all_leadership_roles_empty
        )
      };

      await conn.query(
        "INSERT INTO memberships (student_id, group_id, role, status, join_date) VALUES (?,?,?,?, NOW())",
        [request.student_id, request.group_id, membershipRole, "ACTIVE"]
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
    return {
      message: `Request ${status} successfully`,
      approved_role: status === "APPROVED" ? approvedRole || "MEMBER" : null,
      all_leadership_roles_empty_before_approval:
        status === "APPROVED" ? Boolean(approvalMeta?.all_leadership_roles_empty_before_approval) : null
    };
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
