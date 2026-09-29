const db = require("../../config/db");
const teamRepo = require("../team/team.repository");
const { expandDepartmentCode } = require("../../utils/department.service");
const { buildPaginatedResponse, parsePaginationQuery } = require("../../utils/pagination");

const SECTION_STATUSES = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];

const normalizeText = (value) => String(value || "").trim();
const normalizeCode = (value) => normalizeText(value).toUpperCase();

const normalizeSectionStatus = (value) => {
  const status = normalizeText(value).toUpperCase() || "ACTIVE";
  if (!SECTION_STATUSES.includes(status)) {
    throw new Error(`status must be one of: ${SECTION_STATUSES.join(", ")}`);
  }
  return status;
};

const normalizeOptionalStatus = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return normalizeSectionStatus(value);
};

const normalizeOptionalMembershipStatus = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const status = normalizeText(value).toUpperCase();
  if (!["ACTIVE", "LEFT"].includes(status)) {
    throw new Error("membership status must be ACTIVE or LEFT");
  }
  return status;
};

const normalizeParentTeamId = (value, { required = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) throw new Error("parent_team_id is required");
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("parent_team_id must be a positive integer");
  }
  return parsed;
};

const normalizeSectionId = (value, fieldName = "section_id") => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return parsed;
};

const normalizeRole = (value) => {
  const role = normalizeText(value).toUpperCase() || "MEMBER";
  if (role.length > 50) {
    throw new Error("role must be 50 characters or less");
  }
  return role;
};

const normalizeNotes = (value) => {
  const notes = normalizeText(value);
  if (notes.length > 255) {
    throw new Error("notes must be 255 characters or less");
  }
  return notes || null;
};

const mapSectionRow = (row) => ({
  ...row,
  team_id: Number(row.team_id),
  section_id: Number(row.team_id),
  parent_team_id:
    row.parent_team_id === null || row.parent_team_id === undefined
      ? null
      : Number(row.parent_team_id),
  active_member_count: Number(row.active_member_count) || 0,
  event_id: row.event_id === null || row.event_id === undefined ? null : Number(row.event_id)
});

const mapMembershipRow = (row) => ({
  ...row,
  department: expandDepartmentCode(row.department),
  team_membership_id: Number(row.team_membership_id),
  team_id: Number(row.team_id),
  section_id: Number(row.team_id),
  event_id: row.event_id === null || row.event_id === undefined ? null : Number(row.event_id)
});

const ensureSectionRecord = (row) => {
  if (!row) throw new Error("Section not found");
  if (String(row.team_type || "").toUpperCase() !== "SECTION") {
    throw new Error("Section not found");
  }
  return row;
};

const ensureParentTeamEligible = async (parentTeamId, executor) => {
  const parent = await teamRepo.getTeamById(parentTeamId, executor);
  if (!parent) throw new Error("Parent team not found");

  const parentType = String(parent.team_type || "").toUpperCase();
  if (!["TEAM", "HUB"].includes(parentType)) {
    throw new Error("Sections can only be attached to TEAM or HUB records");
  }

  if (String(parent.status || "").toUpperCase() === "ARCHIVED") {
    throw new Error("Cannot attach a section to an archived parent team");
  }

  return parent;
};

const ensureUniqueCode = async (teamCode, excludeTeamId = null, executor = undefined) => {
  const existing = await teamRepo.getTeamByCode(teamCode, executor);
  if (!existing) return;

  if (excludeTeamId && Number(existing.team_id) === Number(excludeTeamId)) {
    return;
  }

  throw new Error("section_code already exists");
};

const normalizePayload = (payload = {}, fallback = {}) => {
  const team_code = normalizeCode(payload.section_code ?? payload.team_code ?? fallback.team_code);
  const team_name = normalizeText(payload.section_name ?? payload.team_name ?? fallback.team_name);

  if (!team_code) throw new Error("section_code is required");
  if (!team_name) throw new Error("section_name is required");

  return {
    parent_team_id: normalizeParentTeamId(
      payload.parent_team_id ?? fallback.parent_team_id,
      { required: true }
    ),
    team_code,
    team_name,
    status: normalizeSectionStatus(payload.status ?? fallback.status),
    description: normalizeText(payload.description ?? fallback.description) || null
  };
};

const getSections = async (query = {}) => {
  const filters = {
    team_type: "SECTION",
    parent_team_id:
      query.parent_team_id === undefined
        ? undefined
        : normalizeParentTeamId(query.parent_team_id, { required: false }),
    status: normalizeOptionalStatus(query.status)
  };
  const pagination = parsePaginationQuery(query, {
    defaultLimit: 30,
    maxLimit: 200
  });

  const getRows = async () => {
    if (!pagination.enabled) {
      return teamRepo.getAllTeams(filters);
    }

    const { rows, total } = await teamRepo.getAllTeams(
      filters,
      {
        paginate: true,
        limit: pagination.limit,
        offset: pagination.offset
      }
    );

    return buildPaginatedResponse({
      items: (rows || []).map(mapSectionRow),
      total,
      page: pagination.page,
      limit: pagination.limit
    });
  };

  const result = await getRows();
  return Array.isArray(result) ? result.map(mapSectionRow) : result;
};

const getSection = async (sectionId) => {
  const section = ensureSectionRecord(await teamRepo.getTeamById(normalizeSectionId(sectionId)));
  return mapSectionRow(section);
};

const createSection = async (payload = {}, actorUserId = null) => {
  const normalized = normalizePayload(payload, {
    status: "ACTIVE"
  });

  await ensureParentTeamEligible(normalized.parent_team_id);
  await ensureUniqueCode(normalized.team_code);

  const result = await teamRepo.createTeam({
    event_id: null,
    parent_team_id: normalized.parent_team_id,
    team_code: normalized.team_code,
    team_name: normalized.team_name,
    team_type: "SECTION",
    status: normalized.status,
    description: normalized.description,
    rounds_cleared: 0,
    created_by: actorUserId || null
  });

  const section = await teamRepo.getTeamById(result.insertId);
  return section ? mapSectionRow(section) : { section_id: Number(result.insertId) };
};

const updateSection = async (sectionId, payload = {}) => {
  const numericSectionId = normalizeSectionId(sectionId);
  const existing = ensureSectionRecord(await teamRepo.getTeamById(numericSectionId));
  const normalized = normalizePayload(payload, existing);

  await ensureParentTeamEligible(normalized.parent_team_id);
  await ensureUniqueCode(normalized.team_code, numericSectionId);

  await teamRepo.updateTeam(numericSectionId, {
    event_id: null,
    parent_team_id: normalized.parent_team_id,
    team_code: normalized.team_code,
    team_name: normalized.team_name,
    team_type: "SECTION",
    status: normalized.status,
    description: normalized.description
  });

  return getSection(numericSectionId);
};

const setSectionStatus = async (sectionId, status) => {
  const numericSectionId = normalizeSectionId(sectionId);
  ensureSectionRecord(await teamRepo.getTeamById(numericSectionId));
  await teamRepo.setTeamStatus(numericSectionId, normalizeSectionStatus(status));
  return getSection(numericSectionId);
};

const activateSection = async (sectionId) => setSectionStatus(sectionId, "ACTIVE");
const freezeSection = async (sectionId) => setSectionStatus(sectionId, "FROZEN");
const archiveSection = async (sectionId) => setSectionStatus(sectionId, "ARCHIVED");
const deleteSection = async (sectionId) => setSectionStatus(sectionId, "INACTIVE");

const getSectionMemberships = async (sectionId, query = {}) => {
  const section = ensureSectionRecord(await teamRepo.getTeamById(normalizeSectionId(sectionId)));
  const rows = await teamRepo.getTeamMembershipsByTeamId(section.team_id, {
    status: normalizeOptionalMembershipStatus(query.status),
    student_id: query.student_id ? String(query.student_id).trim() : undefined
  });
  return (rows || []).map(mapMembershipRow);
};

const getAllSectionMemberships = async (query = {}) => {
  const pagination = parsePaginationQuery(query, {
    defaultLimit: 30,
    maxLimit: 200
  });
  const filters = {
    team_type: "SECTION",
    status: normalizeOptionalMembershipStatus(query.status),
    team_id: query.section_id ? normalizeSectionId(query.section_id, "section_id") : undefined,
    student_id: query.student_id ? String(query.student_id).trim() : undefined
  };

  if (!pagination.enabled) {
    const rows = await teamRepo.getAllTeamMemberships(filters);
    return (rows || []).map(mapMembershipRow);
  }

  const { rows, total } = await teamRepo.getAllTeamMemberships(
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

const getMySectionMemberships = async (userId, query = {}) => {
  const student = await teamRepo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  const rows = await teamRepo.getAllTeamMemberships({
    team_type: "SECTION",
    status: normalizeOptionalMembershipStatus(query.status),
    student_id: student.student_id
  });

  return {
    student_id: student.student_id,
    memberships: (rows || []).map(mapMembershipRow)
  };
};

const addSectionMember = async (sectionId, payload = {}, actorUserId = null) => {
  const numericSectionId = normalizeSectionId(sectionId);
  const section = ensureSectionRecord(await teamRepo.getTeamById(numericSectionId));
  if (String(section.status || "").toUpperCase() !== "ACTIVE") {
    throw new Error("Only ACTIVE sections can accept members");
  }

  const studentId = normalizeText(payload.student_id);
  if (!studentId) throw new Error("student_id is required");

  const student = await teamRepo.getStudentById(studentId);
  if (!student) throw new Error("Student not found");

  const existing = await teamRepo.findActiveTeamMembershipByTeamAndStudent(
    numericSectionId,
    studentId
  );
  if (existing) throw new Error("Student is already an active member of this section");

  const result = await teamRepo.createTeamMembership({
    team_id: numericSectionId,
    student_id: studentId,
    role: normalizeRole(payload.role),
    assigned_by: actorUserId || null,
    notes: normalizeNotes(payload.notes)
  });

  const row = await teamRepo.getTeamMembershipById(result.insertId);
  return row ? mapMembershipRow(row) : null;
};

const joinSectionAsSelf = async (sectionId, userId, payload = {}) => {
  const student = await teamRepo.getStudentByUserId(userId);
  if (!student) throw new Error("Student not found");

  return addSectionMember(
    sectionId,
    {
      student_id: student.student_id,
      role: "MEMBER",
      notes: payload.notes
    },
    userId
  );
};

const updateSectionMember = async (membershipId, payload = {}) => {
  const membership = await teamRepo.getTeamMembershipById(Number(membershipId));
  if (!membership) throw new Error("Section membership not found");

  const section = ensureSectionRecord(await teamRepo.getTeamById(membership.team_id));
  if (String(section.status || "").toUpperCase() === "ARCHIVED") {
    throw new Error("Archived sections cannot be edited");
  }

  await teamRepo.updateTeamMembership(Number(membershipId), {
    role: normalizeRole(payload.role ?? membership.role),
    notes:
      payload.notes !== undefined ? normalizeNotes(payload.notes) : normalizeNotes(membership.notes)
  });

  const row = await teamRepo.getTeamMembershipById(Number(membershipId));
  return row ? mapMembershipRow(row) : null;
};

const leaveSectionMember = async (membershipId, payload = {}) => {
  const membership = await teamRepo.getTeamMembershipById(Number(membershipId));
  if (!membership) throw new Error("Section membership not found");
  ensureSectionRecord(await teamRepo.getTeamById(membership.team_id));

  await teamRepo.leaveTeamMembership(Number(membershipId), {
    notes: payload.notes !== undefined ? normalizeNotes(payload.notes) : null
  });

  const row = await teamRepo.getTeamMembershipById(Number(membershipId));
  return row ? mapMembershipRow(row) : null;
};

module.exports = {
  getSections,
  getSection,
  createSection,
  updateSection,
  activateSection,
  freezeSection,
  archiveSection,
  deleteSection,
  getSectionMemberships,
  getAllSectionMemberships,
  getMySectionMemberships,
  addSectionMember,
  joinSectionAsSelf,
  updateSectionMember,
  leaveSectionMember
};
