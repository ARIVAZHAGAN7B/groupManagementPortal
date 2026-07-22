const service = require("./eventTeamInvitation.service");
const {
  broadcastEventTeamInvitationChanged,
  broadcastTeamMembershipChanged
} = require("../../realtime/events");

const getMyInvitations = async (req, res) => {
  try {
    const rows = await service.getMyInvitations(req.user?.userId);
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    const status = error.message === "Student not found" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

const respondToInvitation = async (req, res) => {
  try {
    const result = await service.respondToInvitation(
      req.params.invitationId,
      req.body || {},
      req.user || {}
    );

    await broadcastEventTeamInvitationChanged({
      action:
        String(result?.status || "").toUpperCase() === "ACCEPTED"
          ? "EVENT_TEAM_INVITATION_ACCEPTED"
          : "EVENT_TEAM_INVITATION_REJECTED",
      invitationId: result?.invitation_id || Number(req.params.invitationId),
      eventId: result?.event_id || null,
      teamId: result?.team_id || null,
      studentId: result?.student_id || null,
      status: result?.status || null,
      membershipChanged: String(result?.status || "").toUpperCase() === "ACCEPTED"
    });

    if (String(result?.status || "").toUpperCase() === "ACCEPTED") {
      await broadcastTeamMembershipChanged({
        action: "EVENT_TEAM_INVITATION_MEMBERSHIP_ACCEPTED",
        studentId: result?.student_id || null,
        teamId: result?.team_id || null,
        membershipId: result?.team_membership_id || null,
        role: "MEMBER"
      });
    }

    res.json(result);
  } catch (error) {
    const status = ["Invitation not found", "Student not found"].includes(error.message)
      ? 404
      : error.message === "Unauthorized"
        ? 401
        : 400;
    res.status(status).json({ message: error.message });
  }
};

module.exports = {
  getMyInvitations,
  respondToInvitation
};
