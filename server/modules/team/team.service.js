const db = require("../../config/db");
const repo = require("./team.repository");
const eventRepo = require("../event/event.repository");

const TEAM_TYPES = ["TEAM", "HUB", "SECTION", "EVENT"];
const TEAM_STATUSES = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];
const TEAM_MEMBERSHIP_STATUSES = ["ACTIVE", "LEFT"];

const normalizeText = (value) => String(value || "").trim();
const normalizeCode = (value) => normalizeText(value).toUpperCase();

const normalizeRole = (value) => {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return "MEMBER";
  if (normalized.length > 50) throw new Error("role must be 50 characters or less");
  return normalized;
};

const normalizeNotes = (value) => {
  const normalized = normalizeText(value);
  if (normalized.length > 255) throw new Error("notes must be 255 characters or less");
  return normalized || null;
};

const normalizeTeamType = (value) => {
  const normalized = normalizeText(value).toUpperCase() || "TEAM";
  if (!TEAM_TYPES.includes(normalized)) {
    throw new Error(`team_type must be one of: ${TEAM_TYPES.join(", ")}`);
  }
  return normalized;
};

const normalizeTeamStatus = (value) => {
  const normalized = normalizeText(value).toUpperCase() || "ACTIVE";
  if (!TEAM_STATUSES.includes(normalized)) {
    throw new Error(`status must be one of: ${TEAM_STATUSES.join(", ")}`);
  }
  return normalized;
};

const normalizeMembershipStatus = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = normalizeText(value).toUpperCase();
  if (!TEAM_MEMBERSHIP_STATUSES.includes(normalized)) {
    throw new Error(`status must be one of: ${TEAM_MEMBERSHIP_STATUSES.join(", ")}`);
  }
  return normalized;
};

const normalizeEventId = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("event_id must be a positive integer");
  }
  return parsed;
};

const normalizePayload = (payload = {}) => {
  const team_code = normalizeCode(payload.team_code);
  const team_name = normalizeText(payload.team_name);
  const team_type = normalizeTeamType(payload.team_type);
  const status = normalizeTeamStatus(payload.status);
  const description = normalizeText(payload.description);
  const event_id = normalizeEventId(payload.event_id);

  if (!team_code) throw new Error("team_code is required");
  if (!team_name) throw new Error("team_name is required");

  return {
    event_id,
    team_code,
    team_name,
    team_type,
    status,
    description: description || null
  };
};

const mapTeamRow = (row) => ({
  ...row,
  team_id: Number(row.team_id),
  event_id:
    row.event_id === null || row.event_id === undefined ? null : Number(row.event_id),
  active_member_count: Number(row.active_member_count) || 0
});

const mapMembershipRow = (row) => ({
  ...row,
  team_membership_id: Number(row.team_membership_id),
  team_id: Number(row.team_id),
  event_id:
    row.event_id === null || row.event_id === undefined ? null : Number(row.event_id)
});

const ensureUniqueTeamCode = async (teamCode, excludeTeamId = null) => {
  const existing = await repo.getTeamByCode(teamCode);
  if (!existing) return;

  if (excludeTeamId && Number(existing.team_id) === Number(excludeTeamId)) {
    return;
  }

  throw new Error("team_code already exists");
};

const ensureEventExists = async (eventId, executor) => {
  if (eventId === null || eventId === undefined) return null;
  const event = await eventRepo.getEventById(eventId, executor);
  if (!event) throw new Error("Event not found");
  return event;
};

const ensureEventActive = async (eventId, executor) => {
  const event = await ensureEventExists(eventId, executor);
  if (!event) throw new Error("Event not found");
  if (String(event.status || "").toUpperCase() !== "ACTIVE") {
    throw new Error("Only ACTIVE events allow team creation/join");
  }
  return event;
};

const ensureNoActiveEventTeamMembership = async (studentId, eventId, executor) => {
  if (!eventId) return;
  const existing = await repo.findActiveTeamMembershipByStudentAndEvent(
    studentId,
    eventId,
    executor
  );
  if (existing) {
    throw new Error("Student already belongs to an active team in this event");
  }
};

const createTeam = async (payload, actorUserId = null) => {
  const normalized = normalizePayload({
    ...payload,
    status: payload?.status || "ACTIVE"
  });

  if (normalized.event_id !== undefined && normalized.event_id !== null) {
    await ensureEventExists(normalized.event_id);
  }

  await ensureUniqueTeamCode(normalized.team_code);

  const result = await repo.createTeam({
    ...normalized,
    created_by: actorUserId || null
  });

  return {
    team_id: result.insertId
  };
};

const createTeamInEventByStudent = async (eventId, payload, actorUserId) => {
  if (!actorUserId) throw new Error("Unauthorized");

  const student = await repo.getStudentByUserId(actorUserId);
  if (!student) throw new Error("Student not found");

  const normalized = normalizePayload({
    ...payload,
    event_id: Number(eventId),
    team_type: "EVENT",
    status: "ACTIVE"
  });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await ensureEventActive(normalized.event_id, conn);
    await ensureNoActiveEventTeamMembership(student.student_id, normalized.event_id, conn);
    await ensureUniqueTeamCode(normalized.team_code);

    const teamInsert = await repo.createTeam(
      {
        ...normalized,
        created_by: actorUserId
      },
      conn
    );

    const membershipInsert = await repo.createTeamMembership(
      {
        team_id: teamInsert.insertId,
        student_id: student.student_id,
        role: "CAPTAIN",
        assigned_by: actorUserId,
        notes: "Auto-assigned as captain (team creator)"
      },
      conn
    );

    await conn.commit();

    const [teamRow, membershipRow] = await Promise.all([
      repo.getTeamById(teamInsert.insertId),
      repo.getTeamMembershipById(membershipInsert.insertId)
    ]);

    return {
      team: teamRow ? mapTeamRow(teamRow) : { team_id: teamInsert.insertId },
      captain_membership: membershipRow ? mapMembershipRow(membershipRow) : null
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const getTeams = async (query = {}) => {
  const filters = {};
  if (query?.event_id !== undefined) {
    filters.event_id = normalizeEventId(query.event_id);
  }

  const rows = await repo.getAllTeams(filters);
  return (rows || []).map(mapTeamRow);
};

const getTeamsByEvent = async (eventId) => {
  await ensureEventExists(Number(eventId));
  const rows = await repo.getTeamsByEventId(Number(eventId));
  return (rows || []).map(mapTeamRow);
};

const getTeam = async (teamId) => {
  const row = await repo.getTeamById(teamId);
  return row ? mapTeamRow(row) : null;
};

const updateTeam = async (teamId, payload) => {
  const existing = await repo.getTeamById(teamId);
  if (!existing) throw new Error("Team not found");

  const normalized = normalizePayload({
    event_id: payload?.event_id !== undefined ? payload.event_id : existing.event_id,
    team_code: payload?.team_code ?? existing.team_code,
    team_name: payload?.team_name ?? existing.team_name,
    team_type: payload?.team_type ?? existing.team_type,
    status: payload?.status ?? existing.status,
    description:
      payload?.description !== undefined ? payload.description : existing.description
  });

  if (normalized.event_id !== undefined && normalized.event_id !== null) {
    await ensureEventExists(normalized.event_id);
  }

  await ensureUniqueTeamCode(normalized.team_code, teamId);
  await repo.updateTeam(teamId, normalized);

  return { team_id: Number(teamId) };
};

const setTeamStatus = async (teamId, status) => {
  const existing = await repo.getTeamById(teamId);
  if (!existing) throw new Error("Team not found");

  const normalizedStatus = normalizeTeamStatus(status);
  await repo.setTeamStatus(teamId, normalizedStatus);
  return { team_id: Number(teamId), status: normalizedStatus };
};

const activateTeam = async (teamId) => setTeamStatus(teamId, "ACTIVE");
const freezeTeam = async (teamId) => setTeamStatus(teamId, "FROZEN");
const archiveTeam = async (teamId) => setTeamStatus(teamId, "ARCHIVED");
const deleteTeam = async (teamId) => setTeamStatus(teamId, "INACTIVE");

const getTeamMemberships = async (teamId, query = {}) => {
  const team = await repo.getTeamById(teamId);
  if (!team) throw new Error("Team not found");

  const status = normalizeMembershipStatus(query.status);
  const rows = await repo.getTeamMembershipsByTeamId(teamId, {
    status,
    student_id: query.student_id ? String(query.student_id).trim() : undefined
  });

  return (rows || []).map(mapMembershipRow);
};

const getAllTeamMemberships = async (query = {}) => {
  const status = normalizeMembershipStatus(query.status);
  const rows = await repo.getAllTeamMemberships({
    status,
    event_id: query.event_id ? Number(query.event_id) : undefined,
    team_id: query.team_id ? Number(query.team_id) : undefined,
    student_id: query.student_id ? String(query.student_id).trim() : undefined
  });

  return (rows || []).map(mapMembershipRow);
};

const addTeamMember = async (teamId, payload = {}, actorUserId = null) => {
  const team = await repo.getTeamById(teamId);
  if (!team) throw new Error("Team not found");
  if (String(team.status || "").toUpperCase() !== "ACTIVE") {
    throw new Error("Only ACTIVE teams can accept members");
  }

  if (team.event_id) {
    const event = await ensureEventActive(team.event_id);
    if (!event) throw new Error("Event not found");
  }

  const studentId = normalizeText(payload.student_id);
  if (!studentId) throw new Error("student_id is required");

  const student = await repo.getStudentById(studentId);
  if (!student) throw new Error("Student not found");

  const existingActive = await repo.findActiveTeamMembershipByTeamAndStudent(teamId, studentId);
  if (existingActive) {
    throw new Error("Student is already an active member of this team");
  }

  if (team.event_id) {
    await ensureNoActiveEventTeamMembership(studentId, team.event_id);
  }

  const result = await repo.createTeamMembership({
    team_id: Number(teamId),
    student_id: studentId,
    role: normalizeRole(payload.role),
    assigned_by: actorUserId || null,
    notes: normalizeNotes(payload.notes)
  });

  const row = await repo.getTeamMembershipById(result.insertId);
  return row ? mapMembershipRow(row) : null;
};

const joinTeamAsSelf = async (teamId, userId, payload = {}) => {
  if (!userId) throw new Error("Unauthorized");

  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  return addTeamMember(
    teamId,
    {
      student_id: student.student_id,
      role: "MEMBER",
      notes: payload.notes
    },
    userId
  );
};

const updateTeamMember = async (membershipId, payload = {}) => {
  const membership = await repo.getTeamMembershipById(membershipId);
  if (!membership) throw new Error("Team membership not found");
  if (String(membership.status).toUpperCase() !== "ACTIVE") {
    throw new Error("Only ACTIVE team membership can be updated");
  }

  const role = payload.role !== undefined ? normalizeRole(payload.role) : membership.role;
  const notes =
    payload.notes !== undefined ? normalizeNotes(payload.notes) : membership.notes || null;

  await repo.updateTeamMembership(membershipId, { role, notes });
  const row = await repo.getTeamMembershipById(membershipId);
  return row ? mapMembershipRow(row) : null;
};

const leaveTeamMember = async (membershipId, payload = {}) => {
  const membership = await repo.getTeamMembershipById(membershipId);
  if (!membership) throw new Error("Team membership not found");
  if (String(membership.status).toUpperCase() !== "ACTIVE") {
    throw new Error("Team membership is already left");
  }

  await repo.leaveTeamMembership(membershipId, {
    notes: payload.notes !== undefined ? normalizeNotes(payload.notes) : null
  });

  const row = await repo.getTeamMembershipById(membershipId);
  return row ? mapMembershipRow(row) : null;
};

const getMyTeamMemberships = async (userId, query = {}) => {
  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  const status = normalizeMembershipStatus(query.status);
  const rows = await repo.getAllTeamMemberships({
    status,
    event_id: query.event_id ? Number(query.event_id) : undefined,
    student_id: student.student_id
  });

  return {
    student_id: student.student_id,
    memberships: (rows || []).map(mapMembershipRow)
  };
};

module.exports = {
  TEAM_TYPES,
  TEAM_STATUSES,
  TEAM_MEMBERSHIP_STATUSES,
  createTeam,
  createTeamInEventByStudent,
  getTeams,
  getTeamsByEvent,
  getTeam,
  updateTeam,
  setTeamStatus,
  activateTeam,
  freezeTeam,
  archiveTeam,
  deleteTeam,
  getTeamMemberships,
  getAllTeamMemberships,
  addTeamMember,
  joinTeamAsSelf,
  updateTeamMember,
  leaveTeamMember,
  getMyTeamMemberships
};
