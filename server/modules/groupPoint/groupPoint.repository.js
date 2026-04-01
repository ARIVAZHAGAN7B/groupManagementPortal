const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const getMembershipContext = async (membershipId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT membership_id, student_id, group_id, status, join_date, leave_date
     FROM memberships
     WHERE membership_id = ?
     LIMIT 1`,
    [Number(membershipId)]
  );

  return rows[0] || null;
};

const findMembershipForStudentAt = async (studentId, activityAt, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT membership_id, student_id, group_id, status, join_date, leave_date
     FROM memberships
     WHERE student_id = ?
       AND status = 'ACTIVE'
       AND join_date <= ?
       AND (leave_date IS NULL OR leave_date > ?)
     ORDER BY join_date DESC, membership_id DESC
     LIMIT 1`,
    [studentId, activityAt, activityAt]
  );

  return rows[0] || null;
};

const insertGroupPoint = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO group_points
      (student_id, group_id, membership_id, points, created_at)
     VALUES (?, ?, ?, ?, COALESCE(?, NOW()))`,
    [
      payload.student_id,
      Number(payload.group_id),
      Number(payload.membership_id),
      Number(payload.points),
      payload.created_at || null
    ]
  );

  return result.insertId;
};

const getGroupPointById = async (groupPointId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       gp.group_point_id,
       gp.student_id,
       gp.group_id,
       gp.membership_id,
       gp.points,
       gp.created_at,
       m.status AS membership_status,
       s.name AS student_name,
       g.group_code,
       g.group_name
     FROM group_points gp
     LEFT JOIN memberships m
       ON m.membership_id = gp.membership_id
     LEFT JOIN students s
       ON s.student_id = gp.student_id
     LEFT JOIN Sgroup g
       ON g.group_id = gp.group_id
     WHERE gp.group_point_id = ?
     LIMIT 1`,
    [Number(groupPointId)]
  );

  return rows[0] || null;
};

const buildWhere = (filters = {}) => {
  const clauses = [];
  const values = [];

  if (filters.student_id) {
    clauses.push("gp.student_id = ?");
    values.push(filters.student_id);
  }

  if (filters.group_id !== undefined) {
    clauses.push("gp.group_id = ?");
    values.push(Number(filters.group_id));
  }

  if (filters.membership_id !== undefined) {
    clauses.push("gp.membership_id = ?");
    values.push(Number(filters.membership_id));
  }

  if (filters.created_from) {
    clauses.push("gp.created_at >= ?");
    values.push(filters.created_from);
  }

  if (filters.created_to) {
    clauses.push("gp.created_at <= ?");
    values.push(filters.created_to);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values
  };
};

const listGroupPoints = async (filters = {}, paging = {}, executor) => {
  const page = Math.max(1, Number(paging.page) || 1);
  const limit = Math.max(1, Math.min(Number(paging.limit) || 50, 200));
  const offset = (page - 1) * limit;
  const { whereSql, values } = buildWhere(filters);
  const exec = getExecutor(executor);

  const [rows] = await exec.query(
    `SELECT
       gp.group_point_id,
       gp.student_id,
       gp.group_id,
       gp.membership_id,
       gp.points,
       gp.created_at,
       m.status AS membership_status,
       s.name AS student_name,
       g.group_code,
       g.group_name
     FROM group_points gp
     LEFT JOIN memberships m
       ON m.membership_id = gp.membership_id
     LEFT JOIN students s
       ON s.student_id = gp.student_id
     LEFT JOIN Sgroup g
       ON g.group_id = gp.group_id
     ${whereSql}
     ORDER BY gp.created_at DESC, gp.group_point_id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  const [[countRow]] = await exec.query(
    `SELECT COUNT(*) AS total
     FROM group_points gp
     ${whereSql}`,
    values
  );

  return {
    page,
    limit,
    total: Number(countRow?.total) || 0,
    rows
  };
};

const sumGroupPoints = async (filters = {}, executor) => {
  const { whereSql, values } = buildWhere(filters);
  const [[row]] = await getExecutor(executor).query(
    `SELECT COALESCE(SUM(gp.points), 0) AS total_points
     FROM group_points gp
     ${whereSql}`,
    values
  );

  return Number(row?.total_points) || 0;
};

module.exports = {
  getMembershipContext,
  findMembershipForStudentAt,
  insertGroupPoint,
  getGroupPointById,
  listGroupPoints,
  sumGroupPoints
};
