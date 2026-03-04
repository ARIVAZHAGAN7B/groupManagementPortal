const repo = require("./groupPoint.repository");

const normalizeStudentId = (value) => {
  const studentId = String(value || "").trim();
  if (!studentId) {
    throw new Error("student_id is required");
  }
  return studentId;
};

const normalizeGroupId = (value) => {
  const groupId = Number(value);
  if (!Number.isInteger(groupId) || groupId <= 0) {
    throw new Error("group_id must be a positive integer");
  }
  return groupId;
};

const normalizeMembershipId = (value) => {
  const membershipId = Number(value);
  if (!Number.isInteger(membershipId) || membershipId <= 0) {
    throw new Error("membership_id must be a positive integer");
  }
  return membershipId;
};

const normalizeGroupPointId = (value) => {
  const groupPointId = Number(value);
  if (!Number.isInteger(groupPointId) || groupPointId <= 0) {
    throw new Error("group_point_id must be a positive integer");
  }
  return groupPointId;
};

const normalizePoints = (value) => {
  const points = Number(value);
  if (!Number.isInteger(points)) {
    throw new Error("points must be an integer");
  }
  return points;
};

const normalizeDateTimeBoundary = (value, endOfDay = false) => {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed} ${endOfDay ? "23:59:59" : "00:00:00"}`;
  }

  return trimmed;
};

const parsePaging = (query = {}) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.max(1, Math.min(Number(query.limit) || 50, 200))
});

const mapRow = (row) => ({
  ...row,
  group_point_id: Number(row.group_point_id),
  group_id: Number(row.group_id),
  membership_id: Number(row.membership_id),
  points: Number(row.points)
});

const ensureMembershipConsistency = async (studentId, groupId, membershipId) => {
  const membership = await repo.getMembershipContext(membershipId);
  if (!membership) {
    throw new Error("Membership not found");
  }

  if (String(membership.student_id) !== String(studentId)) {
    throw new Error("membership_id does not belong to the provided student_id");
  }

  if (Number(membership.group_id) !== Number(groupId)) {
    throw new Error("membership_id does not belong to the provided group_id");
  }

  return membership;
};

const recordGroupPoint = async (payload = {}) => {
  const student_id = normalizeStudentId(payload.student_id);
  const group_id = normalizeGroupId(payload.group_id);
  const membership_id = normalizeMembershipId(payload.membership_id);
  const points = normalizePoints(payload.points);

  await ensureMembershipConsistency(student_id, group_id, membership_id);

  const groupPointId = await repo.insertGroupPoint({
    student_id,
    group_id,
    membership_id,
    points,
    created_at: payload.created_at || null
  });

  const row = await repo.getGroupPointById(groupPointId);
  if (!row) {
    throw new Error("Failed to load recorded group point");
  }

  return mapRow(row);
};

const getGroupPointById = async (groupPointId) => {
  const normalizedId = normalizeGroupPointId(groupPointId);
  const row = await repo.getGroupPointById(normalizedId);
  if (!row) {
    throw new Error("Group point not found");
  }
  return mapRow(row);
};

const getGroupPoints = async (query = {}) => {
  const result = await repo.listGroupPoints(
    {
      student_id:
        query.student_id === undefined || query.student_id === null || query.student_id === ""
          ? undefined
          : normalizeStudentId(query.student_id),
      group_id:
        query.group_id === undefined || query.group_id === null || query.group_id === ""
          ? undefined
          : normalizeGroupId(query.group_id),
      membership_id:
        query.membership_id === undefined ||
        query.membership_id === null ||
        query.membership_id === ""
          ? undefined
          : normalizeMembershipId(query.membership_id),
      created_from: normalizeDateTimeBoundary(query.created_from, false),
      created_to: normalizeDateTimeBoundary(query.created_to, true)
    },
    parsePaging(query)
  );

  return {
    ...result,
    rows: (result.rows || []).map(mapRow)
  };
};

const getGroupPointTotal = async (query = {}) => {
  const total_points = await repo.sumGroupPoints({
    student_id:
      query.student_id === undefined || query.student_id === null || query.student_id === ""
        ? undefined
        : normalizeStudentId(query.student_id),
    group_id:
      query.group_id === undefined || query.group_id === null || query.group_id === ""
        ? undefined
        : normalizeGroupId(query.group_id),
    membership_id:
      query.membership_id === undefined || query.membership_id === null || query.membership_id === ""
        ? undefined
        : normalizeMembershipId(query.membership_id),
    created_from: normalizeDateTimeBoundary(query.created_from, false),
    created_to: normalizeDateTimeBoundary(query.created_to, true)
  });

  return { total_points };
};

module.exports = {
  recordGroupPoint,
  getGroupPointById,
  getGroupPoints,
  getGroupPointTotal
};
