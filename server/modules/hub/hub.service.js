const db = require("../../config/db");
const repo = require("./hub.repository");
const eventRepo = require("../event/event.repository");
const teamRepo = require("../team/team.repository");
const { expandDepartmentCode } = require("../../utils/department.service");
const { buildPaginatedResponse, parsePaginationQuery } = require("../../utils/pagination");
const {
  HUB_PRIORITY_REQUIREMENTS,
  formatHubPriorityLabel,
  formatHubPriorityRequirementSummary,
  normalizeHubPriority
} = require("./hubRules");

const HUB_STATUSES = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];
const HUB_MEMBERSHIP_STATUSES = ["ACTIVE", "LEFT"];

const normalizeText = (value) => String(value || "").trim();
const normalizeCode = (value) => normalizeText(value).toUpperCase();

const normalizeHubStatus = (value) => {
  const normalized = normalizeText(value).toUpperCase() || "ACTIVE";
  if (!HUB_STATUSES.includes(normalized)) {
    throw new Error(`status must be one of: ${HUB_STATUSES.join(", ")}`);
  }
  return normalized;
};

const normalizeMembershipStatus = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = normalizeText(value).toUpperCase();
  if (!HUB_MEMBERSHIP_STATUSES.includes(normalized)) {
    throw new Error(`status must be one of: ${HUB_MEMBERSHIP_STATUSES.join(", ")}`);
  }
  return normalized;
};

const normalizeNotes = (value) => {
  const normalized = normalizeText(value);
  if (normalized.length > 255) throw new Error("notes must be 255 characters or less");
  return normalized || null;
};

const normalizePayload = (payload = {}) => {
  const hub_code = normalizeCode(payload.hub_code ?? payload.team_code);
  const hub_name = normalizeText(payload.hub_name ?? payload.team_name);
  const hub_priority = normalizeHubPriority(payload.hub_priority, {
    fieldName: "hub_priority",
    required: true
  });
  const status = normalizeHubStatus(payload.status);
  const description = normalizeText(payload.description);

  if (!hub_code) throw new Error("hub_code is required");
  if (!hub_name) throw new Error("hub_name is required");

  return {
    hub_code,
    hub_name,
    hub_priority,
    status,
    description: description || null
  };
};

const mapHubRow = (row) => ({
  ...row,
  hub_id: Number(row.hub_id),
  team_id: Number(row.team_id ?? row.hub_id),
  event_id: null,
  hub_code: row.hub_code || row.team_code || null,
  team_code: row.team_code || row.hub_code || null,
  hub_name: row.hub_name || row.team_name || null,
  team_name: row.team_name || row.hub_name || null,
  team_type: "HUB",
  hub_priority: normalizeText(row?.hub_priority).toUpperCase() || null,
  active_member_count: Number(row.active_member_count) || 0
});

const mapMembershipRow = (row) => ({
  ...row,
  department: expandDepartmentCode(row.department),
  hub_membership_id: Number(row.hub_membership_id),
  team_membership_id: Number(row.team_membership_id ?? row.hub_membership_id),
  hub_id: Number(row.hub_id),
  team_id: Number(row.team_id ?? row.hub_id),
  event_id: null,
  role: "MEMBER",
  hub_code: row.hub_code || row.team_code || null,
  team_code: row.team_code || row.hub_code || null,
  hub_name: row.hub_name || row.team_name || null,
  team_name: row.team_name || row.hub_name || null,
  team_type: "HUB",
  hub_priority: normalizeText(row?.hub_priority).toUpperCase() || null
});

const ensureUniqueHubCode = async (hubCode, excludeHubId = null, executor = undefined) => {
  const existing = await repo.getHubByCode(hubCode, executor);
  if (!existing) return;

  if (excludeHubId && Number(existing.hub_id) === Number(excludeHubId)) {
    return;
  }

  throw new Error("hub_code already exists");
};

const ensureStudentCanJoinHubPriority = async (hubLike, studentId, executor) => {
  const hubPriority = normalizeHubPriority(hubLike?.hub_priority, {
    fieldName: "hub_priority",
    required: true
  });

  const rows = await repo.getActiveHubMembershipCountsByStudent(studentId, executor);
  const priorityCountRow = (rows || []).find(
    (row) => normalizeText(row?.hub_priority).toUpperCase() === hubPriority
  );
  const activeCount = Number(priorityCountRow?.membership_count) || 0;
  const allowedCount = Number(HUB_PRIORITY_REQUIREMENTS[hubPriority]) || 0;

  if (allowedCount > 0 && activeCount >= allowedCount) {
    throw new Error(
      `Students can join only ${allowedCount} ${formatHubPriorityLabel(hubPriority)} priority hubs`
    );
  }
};

const ensureStudentCanLeaveHubWhileInEvents = async (hubLike, studentId, executor) => {
  const [activeHubMemberships, activeEventMemberships] = await Promise.all([
    repo.getAllHubMemberships(
      {
        status: "ACTIVE",
        student_id: studentId
      },
      {},
      executor
    ),
    teamRepo.getAllTeamMemberships(
      {
        status: "ACTIVE",
        student_id: studentId,
        team_type: "EVENT"
      },
      {},
      executor
    )
  ]);

  if (!Array.isArray(activeEventMemberships) || activeEventMemberships.length === 0) {
    return;
  }

  const remainingHubMemberships = (Array.isArray(activeHubMemberships) ? activeHubMemberships : [])
    .filter((membership) => Number(membership.hub_id) !== Number(hubLike.hub_id));
  const remainingPriorityCounts = {
    PROMINENT: 0,
    MEDIUM: 0,
    LOW: 0
  };

  for (const membership of remainingHubMemberships) {
    const membershipPriority = normalizeHubPriority(membership?.hub_priority, {
      allowNull: true
    });
    if (!membershipPriority) continue;

    remainingPriorityCounts[membershipPriority] =
      (Number(remainingPriorityCounts[membershipPriority]) || 0) + 1;
  }

  const missingRequirements = Object.entries(HUB_PRIORITY_REQUIREMENTS).reduce(
    (accumulator, [priority, requiredCount]) => {
      const currentCount = Number(remainingPriorityCounts[priority]) || 0;
      if (currentCount < Number(requiredCount || 0)) {
        accumulator.push(
          `${Number(requiredCount || 0) - currentCount} ${formatHubPriorityLabel(priority)}`
        );
      }
      return accumulator;
    },
    []
  );

  if (missingRequirements.length > 0) {
    throw new Error(
      `You cannot leave this hub while participating in events. Active participants must keep ${formatHubPriorityRequirementSummary()} priority hubs.`
    );
  }

  const remainingHubIdSet = new Set(
    remainingHubMemberships
      .map((membership) => Number(membership.hub_id))
      .filter((value) => Number.isInteger(value) && value > 0)
  );
  const checkedEventIds = new Set();

  for (const membership of activeEventMemberships) {
    const eventId = Number(membership.event_id);
    if (!Number.isInteger(eventId) || eventId <= 0 || checkedEventIds.has(eventId)) {
      continue;
    }

    checkedEventIds.add(eventId);

    const allowedHubs = await eventRepo.getAllowedHubsByEventId(eventId, executor);
    if (!Array.isArray(allowedHubs) || allowedHubs.length === 0) {
      continue;
    }

    const stillEligibleForRestrictedEvent = allowedHubs.some((hub) =>
      remainingHubIdSet.has(Number(hub?.hub_id))
    );

    if (stillEligibleForRestrictedEvent) {
      continue;
    }

    const allowedHubLabels = allowedHubs
      .map((hub) => {
        const hubName = hub?.team_name || hub?.hub_name || hub?.team_code || `Hub ${hub?.hub_id}`;
        const hubPriorityLabel = hub?.hub_priority
          ? ` (${formatHubPriorityLabel(hub.hub_priority)})`
          : "";
        return `${hubName}${hubPriorityLabel}`;
      })
      .join(", ");

    throw new Error(
      `You cannot leave this hub while participating in ${membership.event_name || membership.event_code || `event ${eventId}`}. That event is restricted to these hubs: ${allowedHubLabels}`
    );
  }
};

const createHub = async (payload, actorUserId = null) => {
  const normalized = normalizePayload({
    ...payload,
    status: payload?.status || "ACTIVE"
  });

  await ensureUniqueHubCode(normalized.hub_code);

  const result = await repo.createHub({
    ...normalized,
    created_by: actorUserId || null
  });

  return {
    hub_id: result.insertId,
    team_id: result.insertId
  };
};

const getHubs = async (query = {}) => {
  const filters = {
    status: query?.status ? normalizeHubStatus(query.status) : undefined,
    hub_priority:
      query?.hub_priority !== undefined && query?.hub_priority !== null && query?.hub_priority !== ""
        ? normalizeHubPriority(query.hub_priority, {
            fieldName: "hub_priority"
          })
        : undefined
  };
  const pagination = parsePaginationQuery(query, {
    defaultLimit: 30,
    maxLimit: 200
  });

  if (!pagination.enabled) {
    const rows = await repo.getAllHubs(filters);
    return (rows || []).map(mapHubRow);
  }

  const { rows, total } = await repo.getAllHubs(
    filters,
    {
      paginate: true,
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return buildPaginatedResponse({
    items: (rows || []).map(mapHubRow),
    total,
    page: pagination.page,
    limit: pagination.limit
  });
};

const getHub = async (hubId) => {
  const row = await repo.getHubById(hubId);
  return row ? mapHubRow(row) : null;
};

const updateHub = async (hubId, payload) => {
  const existing = await repo.getHubById(hubId);
  if (!existing) throw new Error("Hub not found");

  const normalized = normalizePayload({
    hub_code: payload?.hub_code ?? payload?.team_code ?? existing.hub_code,
    hub_name: payload?.hub_name ?? payload?.team_name ?? existing.hub_name,
    hub_priority:
      payload?.hub_priority !== undefined ? payload.hub_priority : existing.hub_priority,
    status: payload?.status ?? existing.status,
    description:
      payload?.description !== undefined ? payload.description : existing.description
  });

  await ensureUniqueHubCode(normalized.hub_code, hubId);
  await repo.updateHub(hubId, normalized);
  return { hub_id: Number(hubId), team_id: Number(hubId) };
};

const setHubStatus = async (hubId, status) => {
  const existing = await repo.getHubById(hubId);
  if (!existing) throw new Error("Hub not found");

  const normalizedStatus = normalizeHubStatus(status);
  await repo.setHubStatus(hubId, normalizedStatus);
  return {
    hub_id: Number(hubId),
    team_id: Number(hubId),
    status: normalizedStatus
  };
};

const activateHub = async (hubId) => setHubStatus(hubId, "ACTIVE");
const freezeHub = async (hubId) => setHubStatus(hubId, "FROZEN");
const archiveHub = async (hubId) => setHubStatus(hubId, "ARCHIVED");
const deleteHub = async (hubId) => setHubStatus(hubId, "INACTIVE");

const getHubMemberships = async (hubId, query = {}) => {
  const hub = await repo.getHubById(hubId);
  if (!hub) throw new Error("Hub not found");

  const rows = await repo.getHubMembershipsByHubId(hubId, {
    status: normalizeMembershipStatus(query.status),
    student_id: query.student_id ? String(query.student_id).trim() : undefined
  });

  return (rows || []).map(mapMembershipRow);
};

const getAllHubMemberships = async (query = {}) => {
  const filters = {
    status: normalizeMembershipStatus(query.status),
    hub_id: query.hub_id ? Number(query.hub_id) : undefined,
    student_id: query.student_id ? String(query.student_id).trim() : undefined,
    hub_priority:
      query?.hub_priority !== undefined && query?.hub_priority !== null && query?.hub_priority !== ""
        ? normalizeHubPriority(query.hub_priority, {
            fieldName: "hub_priority"
          })
        : undefined,
    status_in_hub: query?.hub_status ? normalizeHubStatus(query.hub_status) : undefined
  };
  const pagination = parsePaginationQuery(query, {
    defaultLimit: 30,
    maxLimit: 200
  });

  if (!pagination.enabled) {
    const rows = await repo.getAllHubMemberships(filters);
    return (rows || []).map(mapMembershipRow);
  }

  const { rows, total } = await repo.getAllHubMemberships(
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

const getMyHubMemberships = async (userId, query = {}) => {
  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  const rows = await repo.getAllHubMemberships({
    status: normalizeMembershipStatus(query.status),
    student_id: student.student_id,
    hub_priority:
      query?.hub_priority !== undefined && query?.hub_priority !== null && query?.hub_priority !== ""
        ? normalizeHubPriority(query.hub_priority, {
            fieldName: "hub_priority"
          })
        : undefined,
    status_in_hub: query?.hub_status ? normalizeHubStatus(query.hub_status) : undefined
  });

  return {
    student_id: student.student_id,
    memberships: (rows || []).map(mapMembershipRow)
  };
};

const addHubMember = async (hubId, payload = {}, actorUserId = null) => {
  const studentId = normalizeText(payload.student_id);
  if (!studentId) throw new Error("student_id is required");

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const hub = await repo.lockHubById(hubId, conn);
    if (!hub) throw new Error("Hub not found");
    if (String(hub.status || "").toUpperCase() !== "ACTIVE") {
      throw new Error("Only ACTIVE hubs can accept members");
    }

    const student = await repo.getStudentById(studentId, conn);
    if (!student) throw new Error("Student not found");

    const existingActive = await repo.findActiveHubMembershipByHubAndStudent(
      hubId,
      studentId,
      conn
    );
    if (existingActive) {
      throw new Error("Student is already an active member of this hub");
    }

    await ensureStudentCanJoinHubPriority(hub, studentId, conn);

    const result = await repo.createHubMembership(
      {
        hub_id: Number(hubId),
        student_id: studentId,
        assigned_by: actorUserId || null,
        notes: normalizeNotes(payload.notes)
      },
      conn
    );

    await conn.commit();

    const row = await repo.getHubMembershipById(result.insertId);
    return row ? mapMembershipRow(row) : null;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const joinHubAsSelf = async (hubId, userId, payload = {}) => {
  if (!userId) throw new Error("Unauthorized");

  const student = await repo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  return addHubMember(
    hubId,
    {
      student_id: student.student_id,
      notes: payload.notes
    },
    userId
  );
};

const updateHubMembership = async (membershipId, payload = {}) => {
  const membership = await repo.getHubMembershipById(membershipId);
  if (!membership) throw new Error("Hub membership not found");
  if (String(membership.status).toUpperCase() !== "ACTIVE") {
    throw new Error("Only ACTIVE hub membership can be updated");
  }

  if (payload.role !== undefined && normalizeText(payload.role).toUpperCase() !== "MEMBER") {
    throw new Error("Hub memberships support only MEMBER role");
  }

  await repo.updateHubMembership(membershipId, {
    notes: payload.notes !== undefined ? normalizeNotes(payload.notes) : membership.notes || null
  });
  const row = await repo.getHubMembershipById(membershipId);
  return row ? mapMembershipRow(row) : null;
};

const leaveHubMembership = async (membershipId, payload = {}, actorUser = null) => {
  const actorRole = String(actorUser?.role || "").toUpperCase();
  const actorUserId = actorUser?.userId || null;

  if (!actorUserId || !actorRole) {
    throw new Error("Unauthorized");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const membership = await repo.lockHubMembershipById(membershipId, conn);
    if (!membership) throw new Error("Hub membership not found");
    if (String(membership.status).toUpperCase() !== "ACTIVE") {
      throw new Error("Hub membership is already left");
    }

    const hub = await repo.lockHubById(membership.hub_id, conn);
    if (!hub) throw new Error("Hub not found");

    if (!["ADMIN", "SYSTEM_ADMIN"].includes(actorRole)) {
      const actorStudent = await repo.getStudentByUserId(actorUserId, conn);
      if (!actorStudent) throw new Error("Student not found");

      if (String(actorStudent.student_id) !== String(membership.student_id)) {
        throw new Error("Only admin or the member can leave a hub");
      }
    }

    await ensureStudentCanLeaveHubWhileInEvents(hub, membership.student_id, conn);

    await repo.leaveHubMembership(
      membershipId,
      {
        notes:
          payload?.notes !== undefined && payload?.notes !== null
            ? normalizeNotes(payload.notes)
            : null
      },
      conn
    );

    await conn.commit();

    const row = await repo.getHubMembershipById(membershipId);
    return row ? mapMembershipRow(row) : null;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  HUB_STATUSES,
  HUB_MEMBERSHIP_STATUSES,
  createHub,
  getHubs,
  getHub,
  updateHub,
  setHubStatus,
  activateHub,
  freezeHub,
  archiveHub,
  deleteHub,
  getHubMemberships,
  getAllHubMemberships,
  getMyHubMemberships,
  addHubMember,
  joinHubAsSelf,
  updateHubMembership,
  leaveHubMembership
};
