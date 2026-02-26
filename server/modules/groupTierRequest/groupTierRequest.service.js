const db = require("../../config/db");
const repo = require("./groupTierRequest.repository");

const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];
const VALID_TIERS = ["D", "C", "B", "A"];

const tierRank = (tier) => VALID_TIERS.indexOf(String(tier || "").toUpperCase());

const normalizeTier = (value, fieldName = "tier") => {
  const tier = String(value || "")
    .trim()
    .toUpperCase();
  if (!VALID_TIERS.includes(tier)) {
    throw new Error(`${fieldName} must be one of ${VALID_TIERS.join(", ")}`);
  }
  return tier;
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

const ensureCaptainForGroup = async (queryable, userId, groupId) => {
  const studentId = await getStudentIdByUserIdFrom(queryable, userId);
  const [rows] = await queryable.query(
    `SELECT membership_id
     FROM memberships
     WHERE student_id=? AND group_id=? AND status='ACTIVE' AND role='CAPTAIN'
     LIMIT 1`,
    [studentId, groupId]
  );
  if (rows.length === 0) {
    throw new Error("Only the group captain can request tier promotion/demotion");
  }
  return studentId;
};

const ensureAdminActor = async (queryable, actorUser) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");
  const role = String(actorUser.role).toUpperCase();
  if (!ADMIN_ROLES.includes(role)) {
    throw new Error("Only admin can approve or reject tier change requests");
  }
  return getAdminIdByUserIdFrom(queryable, actorUser.userId);
};

const resolveRequestType = (currentTier, requestedTier) => {
  const currentRank = tierRank(currentTier);
  const requestedRank = tierRank(requestedTier);

  if (currentRank === -1 || requestedRank === -1) {
    throw new Error("Invalid group tier");
  }
  if (currentRank === requestedRank) {
    throw new Error("Requested tier must be different from current tier");
  }

  return requestedRank > currentRank ? "PROMOTION" : "DEMOTION";
};

const applyGroupTierChangeRequest = async (actorUser, payload = {}) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");

  const groupId = Number(payload.group_id);
  if (!Number.isInteger(groupId) || groupId <= 0) {
    throw new Error("group_id is required");
  }

  const requestedTier = normalizeTier(payload.requested_tier, "requested_tier");
  const actorRole = String(actorUser.role || "").toUpperCase();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let requestedByStudentId = null;
    let requestedByAdminId = null;

    if (ADMIN_ROLES.includes(actorRole)) {
      requestedByAdminId = await getAdminIdByUserIdFrom(conn, actorUser.userId);
    } else if (actorRole === "CAPTAIN") {
      requestedByStudentId = await ensureCaptainForGroup(conn, actorUser.userId, groupId);
    } else {
      throw new Error("Only captain or admin can request tier promotion/demotion");
    }

    const [groupRows] = await conn.query(
      "SELECT group_id, tier, status FROM Sgroup WHERE group_id=? LIMIT 1 FOR UPDATE",
      [groupId]
    );
    const group = groupRows[0];
    if (!group) throw new Error("Group not found");

    if (String(group.status || "").toUpperCase() === "FROZEN") {
      throw new Error("Cannot request tier change for a frozen group");
    }

    const currentTier = normalizeTier(group.tier, "current_tier");
    const requestType = resolveRequestType(currentTier, requestedTier);

    const existingPending = await repo.findPendingByGroupTx(conn, groupId);
    if (existingPending) {
      throw new Error("This group already has a pending tier change request");
    }

    const result = await repo.createRequestTx(conn, {
      group_id: groupId,
      current_tier: currentTier,
      requested_tier: requestedTier,
      request_type: requestType,
      requested_by_user_role: actorRole,
      requested_by_student_id: requestedByStudentId,
      requested_by_admin_id: requestedByAdminId,
      request_reason: payload.request_reason || null
    });

    await conn.commit();

    return {
      ...result,
      group_id: groupId,
      current_tier: currentTier,
      requested_tier: requestedTier,
      request_type: requestType,
      status: "PENDING"
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const decideGroupTierChangeRequest = async (requestId, status, decisionReason, actorUser) => {
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
    if (!request) throw new Error("Tier change request not found");
    if (String(request.status || "").toUpperCase() !== "PENDING") {
      throw new Error("Tier change request already processed");
    }

    let appliedTier = null;

    if (normalizedStatus === "APPROVED") {
      const [groupRows] = await conn.query(
        "SELECT group_id, tier, status FROM Sgroup WHERE group_id=? LIMIT 1 FOR UPDATE",
        [request.group_id]
      );
      const group = groupRows[0];
      if (!group) throw new Error("Group not found");

      if (String(group.status || "").toUpperCase() === "FROZEN") {
        throw new Error("Cannot approve tier change for a frozen group");
      }

      const liveTier = normalizeTier(group.tier, "current_tier");
      const requestCurrentTier = normalizeTier(request.current_tier, "current_tier");
      const requestedTier = normalizeTier(request.requested_tier, "requested_tier");

      if (liveTier !== requestCurrentTier) {
        throw new Error(
          `Group tier changed to ${liveTier} after this request was submitted. Create a new request.`
        );
      }

      await conn.query("UPDATE Sgroup SET tier=? WHERE group_id=?", [requestedTier, request.group_id]);
      appliedTier = requestedTier;
    }

    await repo.updateDecisionTx(conn, requestId, {
      status: normalizedStatus,
      decision_by_admin_id: adminId,
      decision_reason: decisionReason
    });

    await conn.commit();

    return {
      message: `Tier change request ${normalizedStatus} successfully`,
      tier_change_request_id: Number(requestId),
      status: normalizedStatus,
      group_id: request.group_id,
      applied_tier: appliedTier
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const getAllPendingTierChangeRequests = async (actorUser) => {
  await ensureAdminActor(db, actorUser);
  return repo.findAllPending();
};

const getPendingTierChangeRequestsByGroup = async (groupId, actorUser) => {
  const actorRole = String(actorUser?.role || "").toUpperCase();
  if (ADMIN_ROLES.includes(actorRole)) {
    return repo.findPendingByGroup(groupId);
  }
  if (actorRole !== "CAPTAIN") {
    throw new Error("Unauthorized");
  }
  await ensureCaptainForGroup(db, actorUser.userId, groupId);
  return repo.findPendingByGroup(groupId);
};

const getMyTierChangeRequests = async (actorUser) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");
  const actorRole = String(actorUser.role).toUpperCase();

  if (ADMIN_ROLES.includes(actorRole)) {
    const adminId = await getAdminIdByUserIdFrom(db, actorUser.userId);
    // Admin-side requester history is less critical right now; return pending queue subset they can already access.
    // We still use the adminId read to validate identity and role mapping.
    void adminId;
    return repo.findAllPending();
  }

  if (actorRole !== "CAPTAIN") {
    throw new Error("Only captain or admin can view tier change requests");
  }

  const studentId = await getStudentIdByUserIdFrom(db, actorUser.userId);
  return repo.findByRequesterStudent(studentId);
};

const getAdminTierRequestNotifications = async (actorUser) => {
  await ensureAdminActor(db, actorUser);
  const pendingRequestCount = await repo.countPendingRequests();
  return {
    pending_request_count: pendingRequestCount
  };
};

module.exports = {
  VALID_TIERS,
  applyGroupTierChangeRequest,
  decideGroupTierChangeRequest,
  getAllPendingTierChangeRequests,
  getPendingTierChangeRequestsByGroup,
  getMyTierChangeRequests,
  getAdminTierRequestNotifications
};

