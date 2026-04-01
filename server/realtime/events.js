const {
  emitToAuthenticated,
  emitToAdmins,
  emitToStudent,
  emitToGroup,
  emitToTeam,
  syncStudentRooms
} = require("./socket");

const REALTIME_EVENTS = {
  ADMIN_NOTIFICATIONS: "realtime:admin-notifications",
  JOIN_REQUESTS: "realtime:join-requests",
  EVENT_JOIN_REQUESTS: "realtime:event-join-requests",
  LEADERSHIP_REQUESTS: "realtime:leadership-requests",
  GROUP_TIER_REQUESTS: "realtime:group-tier-requests",
  MEMBERSHIPS: "realtime:memberships",
  TEAM_MEMBERSHIPS: "realtime:team-memberships",
  PHASE: "realtime:phase",
  POINTS: "realtime:points",
  ELIGIBILITY: "realtime:eligibility",
  AUDIT: "realtime:audit"
};

const withRealtimeMeta = (payload = {}) => ({
  ...payload,
  emitted_at: new Date().toISOString()
});

const broadcastAdminNotifications = (payload = {}) => {
  emitToAdmins(REALTIME_EVENTS.ADMIN_NOTIFICATIONS, withRealtimeMeta(payload));
};

const broadcastJoinRequestChanged = async (payload = {}) => {
  const data = withRealtimeMeta(payload);

  emitToAdmins(REALTIME_EVENTS.JOIN_REQUESTS, data);
  emitToGroup(payload.groupId, REALTIME_EVENTS.JOIN_REQUESTS, data);
  emitToStudent(payload.studentId, REALTIME_EVENTS.JOIN_REQUESTS, data);

  if (payload.membershipChanged) {
    await syncStudentRooms(payload.studentId);

    emitToAdmins(REALTIME_EVENTS.MEMBERSHIPS, data);
    emitToGroup(payload.groupId, REALTIME_EVENTS.MEMBERSHIPS, data);
    emitToStudent(payload.studentId, REALTIME_EVENTS.MEMBERSHIPS, data);
  }
};

const broadcastEventJoinRequestChanged = async (payload = {}) => {
  const data = withRealtimeMeta(payload);

  emitToAdmins(REALTIME_EVENTS.EVENT_JOIN_REQUESTS, data);
  emitToTeam(payload.teamId, REALTIME_EVENTS.EVENT_JOIN_REQUESTS, data);
  emitToStudent(payload.studentId, REALTIME_EVENTS.EVENT_JOIN_REQUESTS, data);

  if (payload.membershipChanged) {
    await syncStudentRooms(payload.studentId);

    emitToAdmins(REALTIME_EVENTS.TEAM_MEMBERSHIPS, data);
    emitToTeam(payload.teamId, REALTIME_EVENTS.TEAM_MEMBERSHIPS, data);
    emitToStudent(payload.studentId, REALTIME_EVENTS.TEAM_MEMBERSHIPS, data);
  }
};

const broadcastLeadershipRequestChanged = async (payload = {}) => {
  const data = withRealtimeMeta(payload);

  emitToAdmins(REALTIME_EVENTS.LEADERSHIP_REQUESTS, data);
  emitToGroup(payload.groupId, REALTIME_EVENTS.LEADERSHIP_REQUESTS, data);
  emitToStudent(payload.studentId, REALTIME_EVENTS.LEADERSHIP_REQUESTS, data);
  broadcastAdminNotifications({
    source: "leadership_requests",
    action: payload.action,
    groupId: payload.groupId,
    studentId: payload.studentId,
    requestId: payload.requestId
  });

  if (payload.membershipChanged) {
    emitToAdmins(REALTIME_EVENTS.MEMBERSHIPS, data);
    emitToGroup(payload.groupId, REALTIME_EVENTS.MEMBERSHIPS, data);
    emitToStudent(payload.studentId, REALTIME_EVENTS.MEMBERSHIPS, data);
  }
};

const broadcastGroupTierRequestChanged = (payload = {}) => {
  const data = withRealtimeMeta(payload);

  emitToAdmins(REALTIME_EVENTS.GROUP_TIER_REQUESTS, data);
  emitToGroup(payload.groupId, REALTIME_EVENTS.GROUP_TIER_REQUESTS, data);
  broadcastAdminNotifications({
    source: "group_tier_requests",
    action: payload.action,
    groupId: payload.groupId,
    requestId: payload.requestId
  });
};

const broadcastMembershipChanged = async (payload = {}) => {
  const data = withRealtimeMeta(payload);

  await syncStudentRooms(payload.studentId);

  emitToAdmins(REALTIME_EVENTS.MEMBERSHIPS, data);
  emitToGroup(payload.groupId, REALTIME_EVENTS.MEMBERSHIPS, data);
  emitToStudent(payload.studentId, REALTIME_EVENTS.MEMBERSHIPS, data);
};

const broadcastTeamMembershipChanged = async (payload = {}) => {
  const data = withRealtimeMeta(payload);

  await syncStudentRooms(payload.studentId);

  emitToAdmins(REALTIME_EVENTS.TEAM_MEMBERSHIPS, data);
  emitToTeam(payload.teamId, REALTIME_EVENTS.TEAM_MEMBERSHIPS, data);
  emitToStudent(payload.studentId, REALTIME_EVENTS.TEAM_MEMBERSHIPS, data);
};

const broadcastPhaseChanged = (payload = {}) => {
  emitToAuthenticated(REALTIME_EVENTS.PHASE, withRealtimeMeta(payload));
};

const broadcastPointsChanged = (payload = {}) => {
  const data = withRealtimeMeta(payload);

  emitToAuthenticated(REALTIME_EVENTS.POINTS, data);
  emitToAdmins(REALTIME_EVENTS.POINTS, data);
  emitToGroup(payload.groupId, REALTIME_EVENTS.POINTS, data);
  emitToStudent(payload.studentId, REALTIME_EVENTS.POINTS, data);
};

const broadcastEligibilityChanged = (payload = {}) => {
  const data = withRealtimeMeta(payload);

  emitToAuthenticated(REALTIME_EVENTS.ELIGIBILITY, data);
  emitToAdmins(REALTIME_EVENTS.ELIGIBILITY, data);
  emitToGroup(payload.groupId, REALTIME_EVENTS.ELIGIBILITY, data);
  emitToStudent(payload.studentId, REALTIME_EVENTS.ELIGIBILITY, data);
};

const broadcastAuditChanged = (payload = {}) => {
  emitToAdmins(REALTIME_EVENTS.AUDIT, withRealtimeMeta(payload));
};

module.exports = {
  REALTIME_EVENTS,
  broadcastAdminNotifications,
  broadcastJoinRequestChanged,
  broadcastEventJoinRequestChanged,
  broadcastLeadershipRequestChanged,
  broadcastGroupTierRequestChanged,
  broadcastMembershipChanged,
  broadcastTeamMembershipChanged,
  broadcastPhaseChanged,
  broadcastPointsChanged,
  broadcastEligibilityChanged,
  broadcastAuditChanged
};
