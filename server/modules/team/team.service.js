const db = require("../../config/db");
const repo = require("./team.repository");
const eventRepo = require("../event/event.repository");
const eventHubEligibilityService = require("../event/eventHubEligibility.service");
const participationService = require("../event/eventParticipation.service");
const eventTeamInvitationService = require("../eventTeamInvitation/eventTeamInvitation.service");
const { expandDepartmentCode } = require("../../utils/department.service");
const { buildPaginatedResponse, parsePaginationQuery } = require("../../utils/pagination");

const TEAM_TYPES = ["TEAM", "HUB", "SECTION", "EVENT"];
const ADMIN_CREATABLE_TEAM_TYPES = ["TEAM"];
const TEAM_STATUSES = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];
const TEAM_MEMBERSHIP_STATUSES = ["ACTIVE", "LEFT"];
const EVENT_GROUP_MEMBERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "MEMBER"];
const EVENT_GROUP_LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN"];
const EVENT_REGISTRATION_MODES = ["TEAM", "INDIVIDUAL"];

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

const normalizeOptionalTeamType = (value, fieldName = "team_type") => {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = normalizeText(value).toUpperCase();
  if (!TEAM_TYPES.includes(normalized)) {
    throw new Error(`${fieldName} must be one of: ${TEAM_TYPES.join(", ")}`);
  }
  return normalized;
};

const normalizeRoundsCleared = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error("rounds_cleared must be a non-negative integer");
  }
  return parsed;
};

const normalizeInvitedStudentIds = (value) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((studentId) => normalizeText(studentId))
        .filter(Boolean)
    )
  );

const enforceAdminCreatableTeamType = (teamType) => {
  if (!ADMIN_CREATABLE_TEAM_TYPES.includes(teamType)) {
    throw new Error("Admin can only create TEAM records from Team Management");
  }
};

const enforceAdminManagedTeamTypeTransition = (existingType, nextType) => {
  const current = normalizeText(existingType).toUpperCase();
  const requested = normalizeText(nextType).toUpperCase();

  if (current === "EVENT") {
    if (requested !== "EVENT") {
      throw new Error("Event groups must remain EVENT type");
    }
    return;
  }

  if (current === "SECTION") {
    if (requested !== "SECTION") {
      throw new Error("Legacy SECTION records cannot change type from Team Management");
    }
    return;
  }

  if (!ADMIN_CREATABLE_TEAM_TYPES.includes(requested)) {
    throw new Error("Admin can only save TEAM records from Team Management");
  }
};

const ensureTeamRouteType = (teamType, fieldName = "team_type") => {
  const normalized = normalizeText(teamType).toUpperCase();
  if (normalized === "HUB") {
    throw new Error(`Use /api/hubs instead of /api/teams for ${fieldName}=HUB requests`);
  }
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

const normalizeEventRegistrationMode = (value) => {
  const normalized = normalizeText(value).toUpperCase() || "TEAM";
  if (!EVENT_REGISTRATION_MODES.includes(normalized)) {
    return "TEAM";
  }
  return normalized;
};

const isIndividualRegistrationEvent = (eventLike) =>
  normalizeEventRegistrationMode(
    eventLike?.registration_mode ?? eventLike?.event_registration_mode
  ) === "INDIVIDUAL";

const ensureTeamRegistrationMode = (eventLike) => {
  if (isIndividualRegistrationEvent(eventLike)) {
    throw new Error("This event uses direct individual registration");
  }
};

const ensureIndividualRegistrationMode = (eventLike) => {
  if (!isIndividualRegistrationEvent(eventLike)) {
    throw new Error("This event requires team registration");
  }
};

const sanitizeTeamCodeFragment = (value, fallback) => {
  const normalized = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return normalized || fallback;
};

const buildIndividualTeamName = (eventLike, student) => {
  const studentLabel = normalizeText(student?.name) || normalizeText(student?.student_id) || "Student";
  const eventLabel = normalizeText(eventLike?.event_name) || normalizeText(eventLike?.event_code) || "Event";
  return `${studentLabel} - ${eventLabel}`.slice(0, 120);
};

const buildIndividualTeamDescription = (eventLike, student) =>
  `Direct individual registration for ${normalizeText(eventLike?.event_name) || normalizeText(eventLike?.event_code) || "event"} by ${normalizeText(student?.student_id) || "student"}`.slice(
    0,
    255
  );

const generateUniqueIndividualTeamCode = async (eventLike, student, executor) => {
  const eventFragment = sanitizeTeamCodeFragment(eventLike?.event_code, "EVENT").slice(0, 18);
  const studentFragment = sanitizeTeamCodeFragment(student?.student_id, "STUDENT").slice(0, 18);
  const baseCode = `${eventFragment}${studentFragment}`.slice(0, 36) || "EVENTREG";

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = `${Date.now()}${attempt}`.slice(-12);
    const candidate = `${baseCode}${suffix}`.slice(0, 50);
    const existing = await repo.getTeamByCode(candidate, executor);
    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique registration code for this participant");
};

const getEventDateValue = (source, primaryField, fallbackField = null) => {
  const primary = source?.[primaryField];
  if (primary !== undefined && primary !== null && primary !== "") return primary;
  if (fallbackField) return source?.[fallbackField];
  return null;
};

const getStartOfDay = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
};

const getEndOfDay = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
};

const ensureEventRegistrationWindowOpen = (eventLike) => {
  if (!eventLike) return;

  const registrationStart = getStartOfDay(
    getEventDateValue(eventLike, "registration_start_date", "event_registration_start_date")
  );
  const registrationEnd = getEndOfDay(
    getEventDateValue(eventLike, "registration_end_date", "event_registration_end_date")
  );
  const now = new Date();

  if (registrationStart && now < registrationStart) {
    throw new Error("Registration has not opened for this event yet");
  }

  if (registrationEnd && now > registrationEnd) {
    throw new Error("Registration is closed for this event");
  }
};

const ensureEventRosterUnlocked = (eventLike) => {
  if (!eventLike) return;

  const registrationEnd = getEndOfDay(
    getEventDateValue(eventLike, "registration_end_date", "event_registration_end_date")
  );
  if (registrationEnd && Date.now() > registrationEnd.getTime()) {
    throw new Error("Event team roster is locked because registration has ended");
  }
};

const ensureEventTeamCapacity = (teamLike, plannedMemberCount = null) => {
  if (!teamLike) return;

  const maxMembers = Number(getEventDateValue(teamLike, "max_members", "event_max_members"));
  if (!Number.isInteger(maxMembers) || maxMembers <= 0) return;

  if (plannedMemberCount !== null) {
    if (Number(plannedMemberCount) > maxMembers) {
      throw new Error(`This event only allows up to ${maxMembers} team members`);
    }
    return;
  }

  const activeMemberCount = Number(teamLike.active_member_count) || 0;
  if (activeMemberCount >= maxMembers) {
    throw new Error(`This event group already has the maximum of ${maxMembers} members`);
  }
};

const ensureEventStudentApplicationsAllowed = (eventLike) => {
  if (!eventLike) return;

  const applyByStudent = getEventDateValue(
    eventLike,
    "apply_by_student",
    "event_apply_by_student"
  );

  if (applyByStudent === null || applyByStudent === undefined || applyByStudent === "") {
    return;
  }

  if (
    applyByStudent === false ||
    Number(applyByStudent) === 0 ||
    String(applyByStudent).trim().toLowerCase() === "false"
  ) {
    throw new Error("Student applications are disabled for this event");
  }
};

const normalizePayload = (payload = {}, options = {}) => {
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
    description: description || null,
    rounds_cleared: normalizeRoundsCleared(payload.rounds_cleared)
  };
};

const mapTeamRow = (row) => ({
  ...row,
  team_id: Number(row.team_id),
  event_id:
    row.event_id === null || row.event_id === undefined ? null : Number(row.event_id),
  rounds_cleared: Number(row.rounds_cleared) || 0,
  active_member_count: Number(row.active_member_count) || 0
});

const mapMembershipRow = (row) => ({
  ...row,
  department: expandDepartmentCode(row.department),
  team_membership_id: Number(row.team_membership_id),
  team_id: Number(row.team_id),
  event_id: row.event_id === null || row.event_id === undefined ? null : Number(row.event_id)
});

const isEventGroupTeam = (team) => {
  if (!team) return false;
  const type = String(team.team_type || "").toUpperCase();
  return type === "EVENT" || (team.event_id !== null && team.event_id !== undefined);
};

const normalizeMembershipRoleForTeam = (team, value) => {
  const role = normalizeRole(value);
  if (!isEventGroupTeam(team)) return role;

  if (!EVENT_GROUP_MEMBERSHIP_ROLES.includes(role)) {
    throw new Error(
      `role must be one of: ${EVENT_GROUP_MEMBERSHIP_ROLES.join(", ")} for event groups`
    );
  }

  return role;
};

const ensureLeadershipRoleAvailability = async (
  teamId,
  role,
  excludeMembershipId = null,
  executor
) => {
  const normalizedRole = String(role || "").toUpperCase();
  if (!EVENT_GROUP_LEADERSHIP_ROLES.includes(normalizedRole)) return;

  const existing = await repo.findActiveTeamMembershipByTeamAndRole(
    teamId,
    normalizedRole,
    excludeMembershipId,
    executor
  );
  if (existing) {
    throw new Error(`Event group already has an active ${normalizedRole}`);
  }
};

const ensureUniqueTeamCode = async (teamCode, excludeTeamId = null, executor = undefined) => {
  const existing = await repo.getTeamByCode(teamCode, executor);
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

const lockEventOrThrow = async (eventId, executor) => {
  const event = await eventRepo.lockEventById(eventId, executor);
  if (!event) throw new Error("Event not found");
  return event;
};

const ensureLockedEventActive = async (eventId, executor) => {
  const event = await lockEventOrThrow(eventId, executor);
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

  enforceAdminCreatableTeamType(normalized.team_type);

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
    status: "ACTIVE",
    rounds_cleared: 0
  });
  const invitedStudentIds = normalizeInvitedStudentIds(payload?.invited_student_ids);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const event = await ensureLockedEventActive(normalized.event_id, conn);
    ensureTeamRegistrationMode(event);
    ensureEventStudentApplicationsAllowed(event);
    ensureEventRegistrationWindowOpen(event);
    await eventHubEligibilityService.ensureStudentEligibleForEvent(
      student.student_id,
      event,
      conn
    );
    await ensureNoActiveEventTeamMembership(student.student_id, normalized.event_id, conn);
    await ensureUniqueTeamCode(normalized.team_code, null, conn);
    ensureEventTeamCapacity(event, 1 + invitedStudentIds.length);
    await participationService.ensureTeamCanBecomeValidWithoutOverflow(
      {
        event_id: normalized.event_id,
        team_type: "EVENT",
        status: "ACTIVE",
        active_member_count: 0
      },
      1,
      conn,
      {
        eventLike: event
      }
    );

    for (const invitedStudentId of invitedStudentIds) {
      await eventHubEligibilityService.ensureStudentEligibleForEvent(
        invitedStudentId,
        event,
        conn
      );
    }

    const teamInsert = await repo.createTeam(
      {
        ...normalized,
        created_by: actorUserId,
        rounds_cleared: 0
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

    const invitations = await eventTeamInvitationService.createInvitationsForEventTeam(
      {
        eventId: normalized.event_id,
        teamId: teamInsert.insertId,
        inviterStudentId: student.student_id,
        inviteeStudentIds: invitedStudentIds
      },
      conn
    );

    await participationService.syncEventParticipationCounts(
      normalized.event_id,
      {
        eventLike: event
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
      captain_membership: membershipRow ? mapMembershipRow(membershipRow) : null,
      invitations
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const registerIndividuallyInEvent = async (eventId, actorUserId) => {
  if (!actorUserId) throw new Error("Unauthorized");

  const student = await repo.getStudentByUserId(actorUserId);
  if (!student) throw new Error("Student not found");

  const normalizedEventId = Number(eventId);
  if (!Number.isInteger(normalizedEventId) || normalizedEventId <= 0) {
    throw new Error("event_id must be a positive integer");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const event = await ensureLockedEventActive(normalizedEventId, conn);
    ensureIndividualRegistrationMode(event);
    ensureEventStudentApplicationsAllowed(event);
    ensureEventRegistrationWindowOpen(event);
    await eventHubEligibilityService.ensureStudentEligibleForEvent(
      student.student_id,
      event,
      conn
    );
    await ensureNoActiveEventTeamMembership(student.student_id, normalizedEventId, conn);
    ensureEventTeamCapacity(event, 1);
    await participationService.ensureTeamCanBecomeValidWithoutOverflow(
      {
        event_id: normalizedEventId,
        team_type: "EVENT",
        status: "ACTIVE",
        active_member_count: 0
      },
      1,
      conn,
      {
        eventLike: event
      }
    );

    const team_code = await generateUniqueIndividualTeamCode(event, student, conn);
    const team_name = buildIndividualTeamName(event, student);
    const description = buildIndividualTeamDescription(event, student);

    const teamInsert = await repo.createTeam(
      {
        event_id: normalizedEventId,
        team_code,
        team_name,
        team_type: "EVENT",
        status: "ACTIVE",
        description,
        rounds_cleared: 0,
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
        notes: "Direct individual registration"
      },
      conn
    );

    await participationService.syncEventParticipationCounts(
      normalizedEventId,
      {
        eventLike: event
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
      captain_membership: membershipRow ? mapMembershipRow(membershipRow) : null,
      invitations: []
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const searchEventRegistrationCandidates = async (eventId, userId, query = {}) => {
  if (!userId) throw new Error("Unauthorized");

  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  const event = await ensureEventActive(Number(eventId));
  ensureTeamRegistrationMode(event);
  ensureEventStudentApplicationsAllowed(event);
  ensureEventRegistrationWindowOpen(event);

  const rows = await repo.searchEventRegistrationCandidates(
    Number(eventId),
    query?.q || "",
    student.student_id,
    query?.limit || 12
  );

  const eligibleRows = [];
  for (const row of rows || []) {
    try {
      await eventHubEligibilityService.ensureStudentEligibleForEvent(
        row.student_id,
        Number(eventId)
      );
      eligibleRows.push(row);
    } catch (_error) {
      // Skip ineligible students so the invite search only shows valid candidates.
    }
  }

  return eligibleRows.map((row) => ({
    ...row,
    department: expandDepartmentCode(row.department)
  }));
};

const getTeams = async (query = {}) => {
  const filters = {};
  if (query?.event_id !== undefined) {
    filters.event_id = normalizeEventId(query.event_id);
  }
  filters.team_type = normalizeOptionalTeamType(query?.team_type, "team_type");
  if (filters.team_type) {
    ensureTeamRouteType(filters.team_type);
  }
  filters.exclude_team_type = normalizeOptionalTeamType(
    query?.exclude_team_type,
    "exclude_team_type"
  );
  const pagination = parsePaginationQuery(query, {
    defaultLimit: 30,
    maxLimit: 200
  });

  if (!pagination.enabled) {
    const rows = await repo.getAllTeams(filters);
    return (rows || []).map(mapTeamRow);
  }

  const { rows, total } = await repo.getAllTeams(
    filters,
    {
      paginate: true,
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return buildPaginatedResponse({
    items: (rows || []).map(mapTeamRow),
    total,
    page: pagination.page,
    limit: pagination.limit
  });
};

const getTeamsByEvent = async (eventId, query = {}) => {
  await ensureEventExists(Number(eventId));
  const normalizedType = normalizeOptionalTeamType(query?.team_type, "team_type");
  if (normalizedType) {
    ensureTeamRouteType(normalizedType);
  }
  const filters = {
    team_type: normalizedType || "EVENT"
  };
  const pagination = parsePaginationQuery(query, {
    defaultLimit: 30,
    maxLimit: 200
  });

  if (!pagination.enabled) {
    const rows = await repo.getTeamsByEventId(Number(eventId), filters);
    return (rows || []).map(mapTeamRow);
  }

  const { rows, total } = await repo.getTeamsByEventId(
    Number(eventId),
    filters,
    {
      paginate: true,
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return buildPaginatedResponse({
    items: (rows || []).map(mapTeamRow),
    total,
    page: pagination.page,
    limit: pagination.limit
  });
};

const getTeam = async (teamId) => {
  const row = await repo.getTeamById(teamId);
  if (normalizeText(row?.team_type).toUpperCase() === "HUB") {
    return null;
  }
  return row ? mapTeamRow(row) : null;
};

const updateTeam = async (teamId, payload) => {
  const existing = await repo.getTeamById(teamId);
  if (!existing) throw new Error("Team not found");
  ensureTeamRouteType(existing.team_type);

  const normalized = normalizePayload({
    event_id: payload?.event_id !== undefined ? payload.event_id : existing.event_id,
    team_code: payload?.team_code ?? existing.team_code,
    team_name: payload?.team_name ?? existing.team_name,
    team_type: payload?.team_type ?? existing.team_type,
    status: payload?.status ?? existing.status,
    description:
      payload?.description !== undefined ? payload.description : existing.description,
    rounds_cleared: existing.rounds_cleared
  });

  enforceAdminManagedTeamTypeTransition(existing.team_type, normalized.team_type);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const lockedTeam = await repo.lockTeamById(teamId, conn);
    if (!lockedTeam) throw new Error("Team not found");

    if (isEventGroupTeam(lockedTeam)) {
      if (Number(normalized.event_id) !== Number(lockedTeam.event_id)) {
        throw new Error("Event teams must remain linked to their current event");
      }

      ensureEventRosterUnlocked(lockedTeam);

      const lockedEvent = await lockEventOrThrow(lockedTeam.event_id, conn);
      if (
        String(normalized.status || "").toUpperCase() === "ACTIVE" &&
        String(lockedEvent.status || "").toUpperCase() !== "ACTIVE"
      ) {
        throw new Error("Only ACTIVE events allow team activation");
      }

      await participationService.ensureTeamCanBecomeValidWithoutOverflow(
        {
          ...lockedTeam,
          status: normalized.status
        },
        Number(lockedTeam.active_member_count) || 0,
        conn,
        {
          eventLike: lockedEvent
        }
      );

      await ensureUniqueTeamCode(normalized.team_code, teamId, conn);
      await repo.updateTeam(teamId, normalized, conn);
      await participationService.syncEventParticipationCounts(
        lockedTeam.event_id,
        {
          eventLike: lockedEvent
        },
        conn
      );
    } else {
      if (normalized.event_id !== undefined && normalized.event_id !== null) {
        await ensureEventExists(normalized.event_id, conn);
      }

      await ensureUniqueTeamCode(normalized.team_code, teamId, conn);
      await repo.updateTeam(teamId, normalized, conn);
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  return { team_id: Number(teamId) };
};

const updateEventTeamRoundsCleared = async (teamId, roundsClearedValue) => {
  const existing = await repo.getTeamById(teamId);
  if (!existing) throw new Error("Team not found");
  if (!isEventGroupTeam(existing)) {
    throw new Error("Only event teams support round progress");
  }

  const roundsCleared = normalizeRoundsCleared(roundsClearedValue);
  const rounds = await eventRepo.getRoundsByEventId(existing.event_id);
  if (roundsCleared > rounds.length) {
    throw new Error(`rounds_cleared cannot exceed configured rounds (${rounds.length})`);
  }

  await repo.updateTeamRoundsCleared(teamId, roundsCleared);
  const row = await repo.getTeamById(teamId);
  return row ? mapTeamRow(row) : null;
};

const setTeamStatus = async (teamId, status) => {
  const normalizedStatus = normalizeTeamStatus(status);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const existing = await repo.lockTeamById(teamId, conn);
    if (!existing) throw new Error("Team not found");
    ensureTeamRouteType(existing.team_type);

    if (isEventGroupTeam(existing)) {
      ensureEventRosterUnlocked(existing);

      const lockedEvent = await lockEventOrThrow(existing.event_id, conn);
      if (
        normalizedStatus === "ACTIVE" &&
        String(lockedEvent.status || "").toUpperCase() !== "ACTIVE"
      ) {
        throw new Error("Only ACTIVE events allow team activation");
      }

      await participationService.ensureTeamCanBecomeValidWithoutOverflow(
        {
          ...existing,
          status: normalizedStatus
        },
        Number(existing.active_member_count) || 0,
        conn,
        {
          eventLike: lockedEvent
        }
      );

      await repo.setTeamStatus(teamId, normalizedStatus, conn);
      await participationService.syncEventParticipationCounts(
        existing.event_id,
        {
          eventLike: lockedEvent
        },
        conn
      );
    } else {
      await repo.setTeamStatus(teamId, normalizedStatus, conn);
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  return { team_id: Number(teamId), status: normalizedStatus };
};

const activateTeam = async (teamId) => setTeamStatus(teamId, "ACTIVE");
const freezeTeam = async (teamId) => setTeamStatus(teamId, "FROZEN");
const archiveTeam = async (teamId) => setTeamStatus(teamId, "ARCHIVED");
const deleteTeam = async (teamId) => setTeamStatus(teamId, "INACTIVE");

const getTeamMemberships = async (teamId, query = {}) => {
  const team = await repo.getTeamById(teamId);
  if (!team) throw new Error("Team not found");
  ensureTeamRouteType(team.team_type);

  const status = normalizeMembershipStatus(query.status);
  const rows = await repo.getTeamMembershipsByTeamId(teamId, {
    status,
    student_id: query.student_id ? String(query.student_id).trim() : undefined
  });

  return (rows || []).map(mapMembershipRow);
};

const getAllTeamMemberships = async (query = {}) => {
  const status = normalizeMembershipStatus(query.status);
  const filters = {
    status,
    event_id: query.event_id ? Number(query.event_id) : undefined,
    team_id: query.team_id ? Number(query.team_id) : undefined,
    student_id: query.student_id ? String(query.student_id).trim() : undefined,
    team_type: normalizeOptionalTeamType(query?.team_type, "team_type"),
    exclude_team_type: normalizeOptionalTeamType(
      query?.exclude_team_type,
      "exclude_team_type"
    )
  };
  if (filters.team_type) {
    ensureTeamRouteType(filters.team_type);
  }
  const pagination = parsePaginationQuery(query, {
    defaultLimit: 30,
    maxLimit: 200
  });

  if (!pagination.enabled) {
    const rows = await repo.getAllTeamMemberships(filters);
    return (rows || []).map(mapMembershipRow);
  }

  const { rows, total } = await repo.getAllTeamMemberships(
    filters,
    {
      paginate: true,
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return buildPaginatedResponse({
    items: (rows || []).map(mapMembershipRow),
    total,
    page: pagination.page,
    limit: pagination.limit
  });
};

const addTeamMember = async (teamId, payload = {}, actorUserId = null) => {
  const studentId = normalizeText(payload.student_id);
  if (!studentId) throw new Error("student_id is required");

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const team = await repo.lockTeamById(teamId, conn);
    if (!team) throw new Error("Team not found");
    ensureTeamRouteType(team.team_type);
    if (String(team.status || "").toUpperCase() !== "ACTIVE") {
      throw new Error("Only ACTIVE teams can accept members");
    }

    let event = null;
    if (team.event_id) {
      event = await ensureLockedEventActive(team.event_id, conn);
      ensureEventStudentApplicationsAllowed(event);
      ensureEventRegistrationWindowOpen(event);
      ensureEventRosterUnlocked(event);
      ensureEventTeamCapacity(team, (Number(team.active_member_count) || 0) + 1);
      await participationService.ensureTeamCanBecomeValidWithoutOverflow(
        team,
        (Number(team.active_member_count) || 0) + 1,
        conn,
        {
          eventLike: event
        }
      );
    }

    const student = await repo.getStudentById(studentId, conn);
    if (!student) throw new Error("Student not found");

    const role = normalizeMembershipRoleForTeam(team, payload.role);

    const existingActive = await repo.findActiveTeamMembershipByTeamAndStudent(
      teamId,
      studentId,
      conn
    );
    if (existingActive) {
      throw new Error("Student is already an active member of this team");
    }

    if (team.event_id) {
      await eventHubEligibilityService.ensureStudentEligibleForEvent(
        studentId,
        team.event_id,
        conn
      );
      await ensureNoActiveEventTeamMembership(studentId, team.event_id, conn);
    }

    await ensureLeadershipRoleAvailability(teamId, role, null, conn);

    const result = await repo.createTeamMembership(
      {
        team_id: Number(teamId),
        student_id: studentId,
        role,
        assigned_by: actorUserId || null,
        notes: normalizeNotes(payload.notes)
      },
      conn
    );

    if (team.event_id) {
      await participationService.syncEventParticipationCounts(
        team.event_id,
        {
          eventLike: event
        },
        conn
      );
    }

    await conn.commit();

    const row = await repo.getTeamMembershipById(result.insertId);
    return row ? mapMembershipRow(row) : null;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
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

  const team = await repo.getTeamById(membership.team_id);
  if (isEventGroupTeam(team)) {
    ensureEventRosterUnlocked(team);
  }

  const teamContext = {
    team_id: Number(membership.team_id),
    team_type: membership.team_type,
    event_id: membership.event_id
  };
  const role =
    payload.role !== undefined
      ? normalizeMembershipRoleForTeam(teamContext, payload.role)
      : String(membership.role || "MEMBER").trim().toUpperCase();
  const notes =
    payload.notes !== undefined ? normalizeNotes(payload.notes) : membership.notes || null;

  await ensureLeadershipRoleAvailability(
    Number(membership.team_id),
    role,
    Number(membershipId)
  );

  await repo.updateTeamMembership(membershipId, { role, notes });
  const row = await repo.getTeamMembershipById(membershipId);
  return row ? mapMembershipRow(row) : null;
};

const leaveTeamMember = async (membershipId, payload = {}, actorUser = null) => {
  const actorRole = String(actorUser?.role || "").toUpperCase();
  const actorUserId = actorUser?.userId || null;

  if (!actorUserId || !actorRole) {
    throw new Error("Unauthorized");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const membership = await repo.getTeamMembershipById(membershipId, conn);
    if (!membership) throw new Error("Team membership not found");
    if (String(membership.status).toUpperCase() !== "ACTIVE") {
      throw new Error("Team membership is already left");
    }

    const team = await repo.lockTeamById(membership.team_id, conn);
    if (!team) throw new Error("Team not found");
    ensureTeamRouteType(team.team_type);

    let lockedEvent = null;
    if (isEventGroupTeam(team)) {
      ensureEventRosterUnlocked(team);
      lockedEvent = await lockEventOrThrow(team.event_id, conn);
    }

    if (!["ADMIN", "SYSTEM_ADMIN"].includes(actorRole)) {
      const actorStudent = await repo.getStudentByUserId(actorUserId, conn);
      if (!actorStudent) throw new Error("Student not found");

      const isSelfLeave = String(actorStudent.student_id) === String(membership.student_id);
      if (!isSelfLeave) {
        const actorMembership = await repo.findActiveTeamMembershipByTeamAndStudent(
          Number(membership.team_id),
          actorStudent.student_id,
          conn
        );

        const canCaptainRemove =
          actorRole === "CAPTAIN" &&
          actorMembership &&
          String(actorMembership.role || "").toUpperCase() === "CAPTAIN";

        if (!canCaptainRemove) {
          throw new Error("Only admin or team captain can remove memberships");
        }
      }
    }

    await repo.leaveTeamMembership(
      membershipId,
      {
        notes:
          payload?.notes !== undefined && payload?.notes !== null
            ? normalizeNotes(payload.notes)
            : null
      },
      conn
    );

    if (team.event_id) {
      await participationService.syncEventParticipationCounts(
        team.event_id,
        {
          eventLike: lockedEvent
        },
        conn
      );
    }

    await conn.commit();

    const row = await repo.getTeamMembershipById(membershipId);
    return row ? mapMembershipRow(row) : null;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const getMyTeamMemberships = async (userId, query = {}) => {
  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  const status = normalizeMembershipStatus(query.status);
  const teamType = normalizeOptionalTeamType(query?.team_type, "team_type");
  if (teamType) {
    ensureTeamRouteType(teamType);
  }

  const rows = await repo.getAllTeamMemberships({
    status,
    event_id: query.event_id ? Number(query.event_id) : undefined,
    team_type: teamType,
    exclude_team_type: normalizeOptionalTeamType(
      query?.exclude_team_type,
      "exclude_team_type"
    ),
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
  EVENT_GROUP_MEMBERSHIP_ROLES,
  EVENT_GROUP_LEADERSHIP_ROLES,
  createTeam,
  createTeamInEventByStudent,
  registerIndividuallyInEvent,
  searchEventRegistrationCandidates,
  getTeams,
  getTeamsByEvent,
  getTeam,
  updateTeam,
  updateEventTeamRoundsCleared,
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
