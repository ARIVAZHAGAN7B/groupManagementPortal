const db = require("../../config/db");
const repo = require("./eventJoinRequest.repository");
const teamRepo = require("../team/team.repository");

const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];
const EVENT_MEMBERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "MEMBER"];
const EVENT_LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN"];

const getStudentIdByUserIdFrom = async (queryable, userId) => {
  const [rows] = await queryable.query(
    "SELECT student_id FROM students WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (rows.length === 0) throw new Error("Student not found");
  return rows[0].student_id;
};

const ensureTeamCaptainAccessByUserId = async (queryable, userId, teamId) => {
  const studentId = await getStudentIdByUserIdFrom(queryable, userId);
  const [rows] = await queryable.query(
    `SELECT team_membership_id
     FROM team_membership
     WHERE student_id = ?
       AND team_id = ?
       AND status = 'ACTIVE'
       AND role = 'CAPTAIN'
     LIMIT 1`,
    [studentId, teamId]
  );

  if (rows.length === 0) {
    throw new Error("Only the team captain can manage event join requests");
  }

  return studentId;
};

const resolveDecisionActor = async (queryable, actorUser, teamId) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");

  if (ADMIN_ROLES.includes(actorUser.role)) {
    return {
      decision_by_user_id: String(actorUser.userId),
      decision_by_role: actorUser.role
    };
  }

  await ensureTeamCaptainAccessByUserId(queryable, actorUser.userId, teamId);
  return {
    decision_by_user_id: String(actorUser.userId),
    decision_by_role: "CAPTAIN"
  };
};

const normalizeApprovedRole = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const role = String(value).trim().toUpperCase();
  if (!EVENT_MEMBERSHIP_ROLES.includes(role)) {
    throw new Error("approved_role must be one of CAPTAIN, VICE_CAPTAIN, MEMBER");
  }
  return role;
};

const ensureLeadershipRoleAvailability = async (queryable, teamId, role) => {
  const normalizedRole = String(role || "").trim().toUpperCase();
  if (!EVENT_LEADERSHIP_ROLES.includes(normalizedRole)) return;

  const [rows] = await queryable.query(
    `SELECT team_membership_id
     FROM team_membership
     WHERE team_id = ?
       AND status = 'ACTIVE'
       AND UPPER(role) = ?
     LIMIT 1
     FOR UPDATE`,
    [teamId, normalizedRole]
  );

  if (rows.length > 0) {
    throw new Error(`Event group already has an active ${normalizedRole}`);
  }
};

const ensureTeamCanAcceptRequests = async (executor, teamId) => {
  const team = await teamRepo.getTeamById(teamId, executor);
  if (!team) throw new Error("Team not found");
  if (!team.event_id) throw new Error("This team is not linked to an event");
  if (String(team.status || "").toUpperCase() !== "ACTIVE") {
    throw new Error("Only ACTIVE teams can accept requests");
  }
  if (String(team.event_status || "").toUpperCase() !== "ACTIVE") {
    throw new Error("Only ACTIVE events can accept requests");
  }
  return team;
};

const ensureTeamExists = async (executor, teamId) => {
  const team = await teamRepo.getTeamById(teamId, executor);
  if (!team) throw new Error("Team not found");
  return team;
};

const applyEventJoinRequest = async (studentId, teamId) => {
  const team = await ensureTeamCanAcceptRequests(db, teamId);

  const activeMembership = await teamRepo.findActiveTeamMembershipByTeamAndStudent(
    teamId,
    studentId
  );
  if (activeMembership) {
    throw new Error("Student is already an active member of this team");
  }

  if (team.event_id) {
    const activeInEvent = await teamRepo.findActiveTeamMembershipByStudentAndEvent(
      studentId,
      team.event_id
    );
    if (activeInEvent) {
      throw new Error("Student already belongs to an active team in this event");
    }
  }

  const existingPending = await repo.findPendingRequest(studentId, teamId);
  if (existingPending) throw new Error("Event join request already exists");

  return repo.createRequest(studentId, teamId);
};

const getStudentIdByUserId = async (userId) => getStudentIdByUserIdFrom(db, userId);

const decideEventJoinRequest = async (requestId, status, reason, actorUser, options = {}) => {
  const normalizedStatus = String(status || "").trim().toUpperCase();
  if (!["APPROVED", "REJECTED"].includes(normalizedStatus)) {
    throw new Error("Invalid status");
  }

  const approvedRole = normalizeApprovedRole(options?.approved_role);
  if (approvedRole && normalizedStatus !== "APPROVED") {
    throw new Error("approved_role can only be used when status is APPROVED");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const request = await repo.findByIdTx(conn, requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "PENDING") throw new Error("Request already processed");

    const membershipRole = approvedRole || "MEMBER";

    let targetTeam;
    if (normalizedStatus === "APPROVED") {
      targetTeam = await ensureTeamCanAcceptRequests(conn, request.team_id);
    } else {
      targetTeam = await ensureTeamExists(conn, request.team_id);
    }

    const actor = await resolveDecisionActor(conn, actorUser, request.team_id);

    await repo.updateDecisionTx(
      conn,
      requestId,
      normalizedStatus,
      reason,
      actor.decision_by_user_id,
      actor.decision_by_role
    );

    if (normalizedStatus === "APPROVED") {
      const existingActive = await teamRepo.findActiveTeamMembershipByTeamAndStudent(
        request.team_id,
        request.student_id,
        conn
      );
      if (existingActive) {
        throw new Error("Student is already an active member of this team");
      }

      if (targetTeam?.event_id) {
        const activeInEvent = await teamRepo.findActiveTeamMembershipByStudentAndEvent(
          request.student_id,
          targetTeam.event_id,
          conn
        );
        if (activeInEvent) {
          throw new Error("Student already belongs to an active team in this event");
        }
      }

      if (EVENT_LEADERSHIP_ROLES.includes(membershipRole)) {
        const actorRole = String(actor.decision_by_role || "").toUpperCase();
        const actorIsAdmin = ADMIN_ROLES.includes(actorRole);

        if (membershipRole === "CAPTAIN" && !actorIsAdmin) {
          throw new Error("Only admin can approve requests with CAPTAIN role");
        }

        await ensureLeadershipRoleAvailability(conn, request.team_id, membershipRole);
      }

      await teamRepo.createTeamMembership(
        {
          team_id: request.team_id,
          student_id: request.student_id,
          role: membershipRole,
          assigned_by: String(actorUser.userId),
          notes: `Approved via event join request #${request.event_request_id}`
        },
        conn
      );
    }

    await conn.commit();
    return {
      message: `Request ${normalizedStatus} successfully`,
      approved_role: normalizedStatus === "APPROVED" ? membershipRole : null
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const getPendingRequestsByTeam = async (teamId, actorUser) => {
  if (!actorUser?.userId || !actorUser?.role) throw new Error("Unauthorized");

  const team = await ensureTeamExists(db, teamId);
  if (!team.event_id) throw new Error("This team is not linked to an event");

  if (!ADMIN_ROLES.includes(actorUser.role)) {
    await ensureTeamCaptainAccessByUserId(db, actorUser.userId, teamId);
  }

  return repo.findPendingByTeam(teamId);
};

const getMyEventJoinRequests = async (studentId) => repo.findByStudent(studentId);

module.exports = {
  applyEventJoinRequest,
  getStudentIdByUserId,
  decideEventJoinRequest,
  getPendingRequestsByTeam,
  getMyEventJoinRequests
};
