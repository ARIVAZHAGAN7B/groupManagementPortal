const db = require("../../config/db");
const repo = require("./eventTeamInvitation.repository");
const eventHubEligibilityService = require("../event/eventHubEligibility.service");
const participationService = require("../event/eventParticipation.service");
const teamRepo = require("../team/team.repository");
const { expandDepartmentCode } = require("../../utils/department.service");

const RESPONSE_STATUSES = ["ACCEPTED", "REJECTED"];

const normalizeText = (value) => String(value || "").trim();

const getEndOfDay = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
};

const ensureResponseStatus = (value) => {
  const normalized = normalizeText(value).toUpperCase();
  if (!RESPONSE_STATUSES.includes(normalized)) {
    throw new Error(`status must be one of: ${RESPONSE_STATUSES.join(", ")}`);
  }
  return normalized;
};

const normalizeResponseNote = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.length > 255) {
    throw new Error("response_note must be 255 characters or less");
  }
  return normalized;
};

const getStudentIdByUserId = async (userId, executor = undefined) => {
  const student = await teamRepo.getStudentByUserId(userId, executor);
  if (!student?.student_id) {
    throw new Error("Student not found");
  }
  return student.student_id;
};

const ensureInvitationWindowOpen = (row) => {
  const registrationEnd = getEndOfDay(row?.registration_end_date);
  if (registrationEnd && Date.now() > registrationEnd.getTime()) {
    throw new Error("Registration is closed for this event");
  }
};

const ensureInvitationTargetIsEligible = async ({
  eventId,
  inviteeStudentId,
  teamId,
  executor
}) => {
  await eventHubEligibilityService.ensureStudentEligibleForEvent(
    inviteeStudentId,
    eventId,
    executor
  );

  const existingActive = await teamRepo.findActiveTeamMembershipByStudentAndEvent(
    inviteeStudentId,
    eventId,
    executor
  );
  if (existingActive) {
    throw new Error(`Student ${inviteeStudentId} already belongs to an active team in this event`);
  }

  const existingPending = await repo.findPendingByTeamAndInvitee(
    teamId,
    inviteeStudentId,
    executor
  );
  if (existingPending) {
    throw new Error(`Student ${inviteeStudentId} already has a pending invite for this team`);
  }
};

const createInvitationsForEventTeam = async (
  { eventId, teamId, inviterStudentId, inviteeStudentIds = [] },
  executor
) => {
  const normalizedInviteeIds = Array.from(
    new Set(
      (Array.isArray(inviteeStudentIds) ? inviteeStudentIds : [])
        .map((value) => normalizeText(value))
        .filter(Boolean)
    )
  );

  if (normalizedInviteeIds.length === 0) {
    return [];
  }

  if (normalizedInviteeIds.includes(String(inviterStudentId))) {
    throw new Error("Captain cannot invite the same student twice");
  }

  const students = await teamRepo.getStudentsByIds(normalizedInviteeIds, executor);
  if (students.length !== normalizedInviteeIds.length) {
    const foundIds = new Set(students.map((row) => String(row.student_id)));
    const missingStudentId = normalizedInviteeIds.find((value) => !foundIds.has(String(value)));
    throw new Error(`Student ${missingStudentId} not found`);
  }

  const created = [];
  for (const inviteeStudentId of normalizedInviteeIds) {
    await ensureInvitationTargetIsEligible({
      eventId,
      inviteeStudentId,
      teamId,
      executor
    });

    const result = await repo.createInvitation(
      {
        event_id: eventId,
        team_id: teamId,
        inviter_student_id: inviterStudentId,
        invitee_student_id: inviteeStudentId,
        proposed_role: "MEMBER"
      },
      executor
    );

    const student = students.find(
      (row) => String(row.student_id) === String(inviteeStudentId)
    );

    created.push({
      invitation_id: result.insertId,
      team_id: Number(teamId),
      event_id: Number(eventId),
      inviter_student_id: inviterStudentId,
      invitee_student_id: inviteeStudentId,
      proposed_role: "MEMBER",
      status: "PENDING",
      invitee_name: student?.name || "",
      invitee_email: student?.email || ""
    });
  }

  return created;
};

const getMyInvitations = async (userId) => {
  const studentId = await getStudentIdByUserId(userId);
  await repo.expirePendingForStudent(studentId);
  const rows = await repo.findByStudent(studentId);

  return (rows || []).map((row) => ({
    ...row,
    invitation_id: Number(row.invitation_id),
    event_id: Number(row.event_id),
    team_id: Number(row.team_id),
    rounds_cleared: Number(row.rounds_cleared) || 0,
    inviter_department: row?.inviter_department
      ? expandDepartmentCode(row.inviter_department)
      : undefined
  }));
};

const respondToInvitation = async (invitationId, payload = {}, actorUser = {}) => {
  if (!actorUser?.userId) {
    throw new Error("Unauthorized");
  }

  const normalizedStatus = ensureResponseStatus(payload?.status);
  const responseNote = normalizeResponseNote(payload?.response_note);

  const conn = await db.getConnection();
  let committed = false;
  try {
    await conn.beginTransaction();

    const inviteeStudentId = await getStudentIdByUserId(actorUser.userId, conn);
    const invitation = await repo.findByIdForUpdate(conn, invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (String(invitation.invitee_student_id) !== String(inviteeStudentId)) {
      throw new Error("You can only respond to your own invitations");
    }

    if (String(invitation.status || "").toUpperCase() !== "PENDING") {
      throw new Error("Invitation already processed");
    }

    try {
      ensureInvitationWindowOpen(invitation);
    } catch (error) {
      await repo.updateInvitationResponseTx(
        conn,
        invitationId,
        "EXPIRED",
        "Registration deadline ended"
      );
      await conn.commit();
      committed = true;
      throw error;
    }

    const team = await teamRepo.lockTeamById(invitation.team_id, conn);
    if (!team) {
      throw new Error("Team not found");
    }
    if (!team.event_id) {
      throw new Error("This invitation is not linked to an event team");
    }
    if (String(team.status || "").toUpperCase() !== "ACTIVE") {
      throw new Error("Only ACTIVE event teams can accept invitations");
    }
    if (String(team.event_status || "").toUpperCase() !== "ACTIVE") {
      throw new Error("Only ACTIVE events can accept invitations");
    }

    if (normalizedStatus === "ACCEPTED") {
      await eventHubEligibilityService.ensureStudentEligibleForEvent(
        inviteeStudentId,
        invitation.event_id,
        conn
      );

      const existingTeamMembership =
        await teamRepo.findActiveTeamMembershipByTeamAndStudent(
          invitation.team_id,
          inviteeStudentId,
          conn
        );
      if (existingTeamMembership) {
        throw new Error("You are already an active member of this event team");
      }

      const activeInEvent = await teamRepo.findActiveTeamMembershipByStudentAndEvent(
        inviteeStudentId,
        invitation.event_id,
        conn
      );
      if (activeInEvent) {
        throw new Error("You already belong to an active team in this event");
      }

      const maxMembers = Number(team.event_max_members);
      const activeMemberCount = Number(team.active_member_count) || 0;
      if (Number.isInteger(maxMembers) && maxMembers > 0 && activeMemberCount >= maxMembers) {
        throw new Error(`This event team already has the maximum of ${maxMembers} members`);
      }

      await participationService.ensureTeamCanBecomeValidWithoutOverflow(
        team,
        activeMemberCount + 1,
        conn,
        {
          lockEvent: true
        }
      );

      const membershipResult = await teamRepo.createTeamMembership(
        {
          team_id: invitation.team_id,
          student_id: inviteeStudentId,
          role: invitation.proposed_role || "MEMBER",
          assigned_by: actorUser.userId,
          notes: `Accepted via event team invitation #${invitation.invitation_id}`
        },
        conn
      );

      await repo.updateInvitationResponseTx(
        conn,
        invitationId,
        "ACCEPTED",
        responseNote
      );

      await participationService.syncEventParticipationCounts(
        invitation.event_id,
        {
          lockEvent: true
        },
        conn
      );

      await conn.commit();
      committed = true;
      return {
        invitation_id: Number(invitationId),
        event_id: Number(invitation.event_id),
        team_id: Number(invitation.team_id),
        student_id: inviteeStudentId,
        status: "ACCEPTED",
        team_membership_id: membershipResult.insertId
      };
    }

    await repo.updateInvitationResponseTx(conn, invitationId, "REJECTED", responseNote);
    await conn.commit();
    committed = true;
    return {
      invitation_id: Number(invitationId),
      event_id: Number(invitation.event_id),
      team_id: Number(invitation.team_id),
      student_id: inviteeStudentId,
      status: "REJECTED",
      team_membership_id: null
    };
  } catch (error) {
    if (!committed) {
      await conn.rollback();
    }
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  createInvitationsForEventTeam,
  getMyInvitations,
  respondToInvitation
};
