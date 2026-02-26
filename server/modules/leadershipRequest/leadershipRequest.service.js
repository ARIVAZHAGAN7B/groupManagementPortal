const db = require("../../config/db");
const repo = require("./leadershipRequest.repository");
const systemConfigService = require("../systemConfig/systemConfig.service");

const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];
const LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];

const normalizeLeadershipRole = (value) => {
  const role = String(value || "")
    .trim()
    .toUpperCase();

  if (!LEADERSHIP_ROLES.includes(role)) {
    throw new Error("requested_role must be one of CAPTAIN, VICE_CAPTAIN, STRATEGIST, MANAGER");
  }

  return role;
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

const ensureAdminActor = async (queryable, actorUser) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");
  const role = String(actorUser.role).toUpperCase();
  if (!ADMIN_ROLES.includes(role)) {
    throw new Error("Only admin can manage leadership role requests");
  }
  return getAdminIdByUserIdFrom(queryable, actorUser.userId);
};

const getLeadershipSnapshotTx = async (conn, groupId) => {
  const [rows] = await conn.query(
    `SELECT
       SUM(CASE WHEN status='ACTIVE' AND role='CAPTAIN' THEN 1 ELSE 0 END) AS captain_count,
       SUM(CASE WHEN status='ACTIVE' AND role='VICE_CAPTAIN' THEN 1 ELSE 0 END) AS vice_captain_count,
       SUM(CASE WHEN status='ACTIVE' AND role='STRATEGIST' THEN 1 ELSE 0 END) AS strategist_count,
       SUM(CASE WHEN status='ACTIVE' AND role='MANAGER' THEN 1 ELSE 0 END) AS manager_count,
       COUNT(CASE WHEN status='ACTIVE' THEN 1 END) AS active_member_count
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
    manager_count: Number(row.manager_count) || 0,
    active_member_count: Number(row.active_member_count) || 0
  };

  const missingRoles = LEADERSHIP_ROLES.filter((role) => {
    if (role === "CAPTAIN") return snapshot.captain_count === 0;
    if (role === "VICE_CAPTAIN") return snapshot.vice_captain_count === 0;
    if (role === "STRATEGIST") return snapshot.strategist_count === 0;
    if (role === "MANAGER") return snapshot.manager_count === 0;
    return false;
  });

  return {
    ...snapshot,
    missing_roles: missingRoles,
    active_leadership_count:
      snapshot.captain_count +
      snapshot.vice_captain_count +
      snapshot.strategist_count +
      snapshot.manager_count
  };
};

const resolveActivationStatus = (snapshot, policy) => {
  const min = Number(policy.min_group_members) || 9;
  const max = Number(policy.max_group_members) || 11;
  const memberCount = Number(snapshot.active_member_count) || 0;
  const leadershipFilled =
    Number(snapshot.captain_count) > 0 &&
    Number(snapshot.vice_captain_count) > 0 &&
    Number(snapshot.strategist_count) > 0 &&
    Number(snapshot.manager_count) > 0;

  const countValid = memberCount >= min && memberCount <= max;
  const leadershipValid = policy.require_leadership_for_activation ? leadershipFilled : true;

  return {
    status: countValid && leadershipValid ? "ACTIVE" : "INACTIVE",
    count_valid: countValid,
    leadership_filled: leadershipFilled
  };
};

const refreshGroupStatusTx = async (conn, groupId) => {
  const [groupRows] = await conn.query(
    "SELECT group_id, status FROM Sgroup WHERE group_id=? LIMIT 1 FOR UPDATE",
    [groupId]
  );
  const group = groupRows[0];
  if (!group) throw new Error("Group not found");

  if (String(group.status || "").toUpperCase() === "FROZEN") {
    return {
      group_id: groupId,
      status: "FROZEN",
      frozen: true
    };
  }

  const policy = await systemConfigService.getOperationalPolicy();
  const snapshot = await getLeadershipSnapshotTx(conn, groupId);
  const next = resolveActivationStatus(snapshot, policy);

  await conn.query("UPDATE Sgroup SET status=? WHERE group_id=?", [next.status, groupId]);

  return {
    group_id: Number(groupId),
    status: next.status,
    frozen: false,
    snapshot: {
      active_member_count: snapshot.active_member_count,
      missing_roles: snapshot.missing_roles,
      leadership_filled: next.leadership_filled
    }
  };
};

const applyLeadershipRoleRequest = async (actorUser, payload = {}) => {
  if (!actorUser?.userId) throw new Error("Unauthorized");
  const requestedRole = normalizeLeadershipRole(payload.requested_role);
  const groupId = Number(payload.group_id);
  if (!Number.isInteger(groupId) || groupId <= 0) {
    throw new Error("group_id is required");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const studentId = await getStudentIdByUserIdFrom(conn, actorUser.userId);

    const [membershipRows] = await conn.query(
      `SELECT m.membership_id, m.student_id, m.group_id, m.role, m.status, g.status AS group_status
       FROM memberships m
       JOIN Sgroup g ON g.group_id = m.group_id
       WHERE m.student_id=? AND m.group_id=? AND m.status='ACTIVE'
       LIMIT 1
       FOR UPDATE`,
      [studentId, groupId]
    );
    const membership = membershipRows[0];
    if (!membership) {
      throw new Error("You must be an active member of this group to request a leadership role");
    }

    if (String(membership.group_status || "").toUpperCase() === "FROZEN") {
      throw new Error("Cannot request leadership role for a frozen group");
    }

    const currentRole = String(membership.role || "").toUpperCase();
    if (LEADERSHIP_ROLES.includes(currentRole)) {
      throw new Error("You already hold a leadership role in this group");
    }

    if (currentRole !== "MEMBER") {
      throw new Error("Only active members can request leadership roles");
    }

    const existingPending = await repo.findPendingByStudentAndGroupTx(conn, studentId, groupId);
    if (existingPending) {
      throw new Error("You already have a pending leadership role request for this group");
    }

    const snapshot = await getLeadershipSnapshotTx(conn, groupId);
    if (!snapshot.missing_roles.includes(requestedRole)) {
      throw new Error(`The ${requestedRole} role is already filled`);
    }

    if (snapshot.missing_roles.length === 0) {
      throw new Error("This group has no missing leadership roles");
    }

    const result = await repo.createRequestTx(conn, {
      membership_id: membership.membership_id,
      student_id: membership.student_id,
      group_id: membership.group_id,
      requested_role: requestedRole,
      request_reason: payload.request_reason || null
    });

    await conn.commit();

    return {
      ...result,
      group_id: membership.group_id,
      student_id: membership.student_id,
      requested_role: requestedRole,
      leadership_alert_triggered:
        snapshot.active_member_count > 0 && snapshot.active_leadership_count === 0,
      missing_roles_at_request_time: snapshot.missing_roles
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const decideLeadershipRoleRequest = async (requestId, status, decisionReason, actorUser) => {
  const normalizedStatus = String(status || "")
    .trim()
    .toUpperCase();
  if (!["APPROVED", "REJECTED"].includes(normalizedStatus)) {
    throw new Error("Invalid status");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const adminId = await ensureAdminActor(conn, actorUser);

    const request = await repo.findByIdTx(conn, requestId);
    if (!request) throw new Error("Leadership role request not found");
    if (String(request.status || "").toUpperCase() !== "PENDING") {
      throw new Error("Leadership role request already processed");
    }

    let groupRefresh = null;

    if (normalizedStatus === "APPROVED") {
      const [membershipRows] = await conn.query(
        `SELECT membership_id, student_id, group_id, role, status
         FROM memberships
         WHERE membership_id=?
         LIMIT 1
         FOR UPDATE`,
        [request.membership_id]
      );
      const membership = membershipRows[0];

      if (!membership) throw new Error("Membership not found");
      if (String(membership.status || "").toUpperCase() !== "ACTIVE") {
        throw new Error("Membership is not active");
      }

      if (
        String(membership.student_id) !== String(request.student_id) ||
        String(membership.group_id) !== String(request.group_id)
      ) {
        throw new Error("Membership no longer matches the request");
      }

      if (LEADERSHIP_ROLES.includes(String(membership.role || "").toUpperCase())) {
        throw new Error("Student already holds a leadership role");
      }

      const [groupRows] = await conn.query(
        "SELECT group_id, status FROM Sgroup WHERE group_id=? LIMIT 1 FOR UPDATE",
        [request.group_id]
      );
      const group = groupRows[0];
      if (!group) throw new Error("Group not found");
      if (String(group.status || "").toUpperCase() === "FROZEN") {
        throw new Error("Cannot approve leadership role request for a frozen group");
      }

      const requestedRole = String(request.requested_role || "").toUpperCase();
      if (!LEADERSHIP_ROLES.includes(requestedRole)) {
        throw new Error("Requested leadership role is invalid");
      }

      const [sameRoleRows] = await conn.query(
        `SELECT membership_id
         FROM memberships
         WHERE group_id=? AND status='ACTIVE' AND role=?
         LIMIT 1
         FOR UPDATE`,
        [request.group_id, requestedRole]
      );
      if (sameRoleRows.length > 0 && String(sameRoleRows[0].membership_id) !== String(membership.membership_id)) {
        throw new Error(`Group already has an active ${requestedRole}`);
      }

      await conn.query(
        "UPDATE memberships SET role=? WHERE membership_id=?",
        [requestedRole, membership.membership_id]
      );

      groupRefresh = await refreshGroupStatusTx(conn, request.group_id);
    }

    await repo.updateDecisionTx(
      conn,
      requestId,
      normalizedStatus,
      decisionReason,
      adminId
    );

    await conn.commit();

    return {
      message: `Leadership role request ${normalizedStatus} successfully`,
      status: normalizedStatus,
      leadership_request_id: Number(requestId),
      requested_role: normalizedStatus === "APPROVED" ? request.requested_role : null,
      group_status: groupRefresh?.status || null
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const getPendingLeadershipRequestsByGroup = async (groupId, actorUser) => {
  await ensureAdminActor(db, actorUser);
  return repo.findPendingByGroup(groupId);
};

const getAllPendingLeadershipRequests = async (actorUser) => {
  await ensureAdminActor(db, actorUser);
  return repo.findAllPending();
};

const getMyLeadershipRoleRequests = async (actorUser) => {
  if (!actorUser?.userId) throw new Error("Unauthorized");
  const studentId = await getStudentIdByUserIdFrom(db, actorUser.userId);
  return repo.findByStudent(studentId);
};

const getAdminNotificationSummary = async (actorUser) => {
  await ensureAdminActor(db, actorUser);

  const [pendingRequestCount, groupsWithoutLeadershipCount, groupsWithoutLeadership] = await Promise.all([
    repo.countPendingRequests(),
    repo.countGroupsWithoutLeadership(),
    repo.listGroupsWithoutLeadership(8)
  ]);

  return {
    pending_request_count: pendingRequestCount,
    groups_without_leadership_count: groupsWithoutLeadershipCount,
    total_attention_count: pendingRequestCount + groupsWithoutLeadershipCount,
    groups_without_leadership: groupsWithoutLeadership
  };
};

module.exports = {
  LEADERSHIP_ROLES,
  applyLeadershipRoleRequest,
  decideLeadershipRoleRequest,
  getPendingLeadershipRequestsByGroup,
  getAllPendingLeadershipRequests,
  getMyLeadershipRoleRequests,
  getAdminNotificationSummary
};
