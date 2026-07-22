const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const appendPaginationClause = (sql, values, options = {}) => {
  if (!options?.paginate) {
    return {
      sql,
      values
    };
  }

  return {
    sql: `${sql} LIMIT ? OFFSET ?`,
    values: [
      ...values,
      Math.max(1, Number(options.limit) || 50),
      Math.max(0, Number(options.offset) || 0)
    ]
  };
};

const HUB_SELECT_WITH_COUNTS = `
  SELECT
    h.hub_id,
    h.hub_id AS team_id,
    NULL AS event_id,
    h.hub_code,
    h.hub_code AS team_code,
    h.hub_name,
    h.hub_name AS team_name,
    'HUB' AS team_type,
    h.hub_priority,
    h.status,
    h.description,
    h.created_by,
    h.created_at,
    h.updated_at,
    COALESCE(mc.active_member_count, 0) AS active_member_count
  FROM hubs h
  LEFT JOIN (
    SELECT hub_id, COUNT(*) AS active_member_count
    FROM hub_membership
    WHERE status = 'ACTIVE'
    GROUP BY hub_id
  ) mc
    ON mc.hub_id = h.hub_id
`;

const HUB_ORDER_BY = `
  ORDER BY
    CASE h.status
      WHEN 'ACTIVE' THEN 1
      WHEN 'FROZEN' THEN 2
      WHEN 'INACTIVE' THEN 3
      WHEN 'ARCHIVED' THEN 4
      ELSE 5
    END,
    CASE h.hub_priority
      WHEN 'PROMINENT' THEN 1
      WHEN 'MEDIUM' THEN 2
      WHEN 'LOW' THEN 3
      ELSE 4
    END,
    h.hub_name ASC,
    h.hub_id ASC
`;

const HUB_MEMBERSHIP_SELECT = `
  SELECT
    hm.hub_membership_id,
    hm.hub_membership_id AS team_membership_id,
    hm.hub_id,
    hm.hub_id AS team_id,
    hm.student_id,
    'MEMBER' AS role,
    hm.status,
    hm.join_date,
    hm.leave_date,
    hm.assigned_by,
    hm.notes,
    hm.created_at,
    hm.updated_at,
    NULL AS event_id,
    h.hub_code,
    h.hub_code AS team_code,
    h.hub_name,
    h.hub_name AS team_name,
    'HUB' AS team_type,
    h.hub_priority,
    h.status AS team_status,
    NULL AS event_code,
    NULL AS event_name,
    NULL AS event_status,
    NULL AS event_start_date,
    NULL AS event_end_date,
    s.name AS student_name,
    s.email AS student_email,
    s.department,
    s.year
  FROM hub_membership hm
  INNER JOIN hubs h
    ON h.hub_id = hm.hub_id
  INNER JOIN students s
    ON s.student_id = hm.student_id
`;

const createHub = async (hub, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO hubs
      (
        hub_code,
        hub_name,
        hub_priority,
        status,
        description,
        created_by
      )
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      hub.hub_code,
      hub.hub_name,
      hub.hub_priority,
      hub.status,
      hub.description || null,
      hub.created_by || null
    ]
  );
  return result;
};

const getAllHubs = async (filters = {}, options = {}, executor) => {
  const clauses = ["1=1"];
  const values = [];

  if (filters.status) {
    clauses.push("h.status = ?");
    values.push(String(filters.status).toUpperCase());
  }

  if (filters.hub_priority) {
    clauses.push("h.hub_priority = ?");
    values.push(String(filters.hub_priority).toUpperCase());
  }

  const baseSql = `
    ${HUB_SELECT_WITH_COUNTS}
    WHERE ${clauses.join(" AND ")}
    ${HUB_ORDER_BY}
  `;

  if (!options?.paginate) {
    const [rows] = await getExecutor(executor).query(baseSql, values);
    return rows;
  }

  const [[countRow]] = await getExecutor(executor).query(
    `SELECT COUNT(*) AS total
     FROM hubs h
     WHERE ${clauses.join(" AND ")}`,
    values
  );
  const paginated = appendPaginationClause(baseSql, values, options);
  const [rows] = await getExecutor(executor).query(paginated.sql, paginated.values);
  return {
    rows,
    total: Number(countRow?.total) || 0
  };
};

const getHubById = async (hubId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${HUB_SELECT_WITH_COUNTS}
     WHERE h.hub_id = ?
     LIMIT 1`,
    [hubId]
  );
  return rows[0] || null;
};

const lockHubById = async (hubId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${HUB_SELECT_WITH_COUNTS}
     WHERE h.hub_id = ?
     LIMIT 1
     FOR UPDATE`,
    [hubId]
  );
  return rows[0] || null;
};

const getHubByCode = async (hubCode, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       hub_id,
       hub_code,
       hub_name,
       hub_priority,
       status
     FROM hubs
     WHERE hub_code = ?
     LIMIT 1`,
    [hubCode]
  );
  return rows[0] || null;
};

const getHubsByIds = async (hubIds = [], executor) => {
  const normalizedIds = Array.from(
    new Set(
      (Array.isArray(hubIds) ? hubIds : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );

  if (normalizedIds.length === 0) {
    return [];
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const [rows] = await getExecutor(executor).query(
    `SELECT
       hub_id,
       hub_code,
       hub_name,
       hub_priority,
       status
     FROM hubs
     WHERE hub_id IN (${placeholders})`,
    normalizedIds
  );
  return rows;
};

const updateHub = async (hubId, hub, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE hubs
     SET
       hub_code = ?,
       hub_name = ?,
       hub_priority = ?,
       status = ?,
       description = ?
     WHERE hub_id = ?`,
    [
      hub.hub_code,
      hub.hub_name,
      hub.hub_priority,
      hub.status,
      hub.description || null,
      hubId
    ]
  );
  return result;
};

const setHubStatus = async (hubId, status, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE hubs
     SET status = ?
     WHERE hub_id = ?`,
    [status, hubId]
  );
  return result;
};

const getStudentById = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT student_id, name, email, department, year
     FROM students
     WHERE student_id = ?
     LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
};

const getStudentByUserId = async (userId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT student_id, name, email, department, year
     FROM students
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

const createHubMembership = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO hub_membership
      (hub_id, student_id, status, assigned_by, notes)
     VALUES (?, ?, 'ACTIVE', ?, ?)`,
    [
      payload.hub_id,
      payload.student_id,
      payload.assigned_by || null,
      payload.notes || null
    ]
  );
  return result;
};

const getHubMembershipById = async (membershipId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${HUB_MEMBERSHIP_SELECT}
     WHERE hm.hub_membership_id = ?
     LIMIT 1`,
    [membershipId]
  );
  return rows[0] || null;
};

const lockHubMembershipById = async (membershipId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${HUB_MEMBERSHIP_SELECT}
     WHERE hm.hub_membership_id = ?
     LIMIT 1
     FOR UPDATE`,
    [membershipId]
  );
  return rows[0] || null;
};

const findActiveHubMembershipByHubAndStudent = async (hubId, studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT hub_membership_id, hub_id, student_id, status
     FROM hub_membership
     WHERE hub_id = ? AND student_id = ? AND status = 'ACTIVE'
     LIMIT 1`,
    [hubId, studentId]
  );
  return rows[0] || null;
};

const getHubMembershipsByHubId = async (hubId, filters = {}, executor) => {
  const clauses = ["hm.hub_id = ?"];
  const values = [hubId];

  if (filters.status) {
    clauses.push("hm.status = ?");
    values.push(filters.status);
  }

  if (filters.student_id) {
    clauses.push("hm.student_id = ?");
    values.push(filters.student_id);
  }

  const [rows] = await getExecutor(executor).query(
    `${HUB_MEMBERSHIP_SELECT}
     WHERE ${clauses.join(" AND ")}
     ORDER BY
       CASE hm.status WHEN 'ACTIVE' THEN 1 ELSE 2 END,
       hm.join_date DESC,
       hm.hub_membership_id DESC`,
    values
  );
  return rows;
};

const getAllHubMemberships = async (filters = {}, options = {}, executor) => {
  const clauses = ["1=1"];
  const values = [];

  if (filters.status) {
    clauses.push("hm.status = ?");
    values.push(filters.status);
  }

  if (filters.hub_id) {
    clauses.push("hm.hub_id = ?");
    values.push(filters.hub_id);
  }

  if (filters.student_id) {
    clauses.push("hm.student_id = ?");
    values.push(filters.student_id);
  }

  if (filters.hub_priority) {
    clauses.push("h.hub_priority = ?");
    values.push(String(filters.hub_priority).toUpperCase());
  }

  if (filters.status_in_hub) {
    clauses.push("h.status = ?");
    values.push(String(filters.status_in_hub).toUpperCase());
  }

  const baseSql = `
    ${HUB_MEMBERSHIP_SELECT}
    WHERE ${clauses.join(" AND ")}
    ORDER BY
      CASE hm.status WHEN 'ACTIVE' THEN 1 ELSE 2 END,
      hm.join_date DESC,
      hm.hub_membership_id DESC
  `;

  if (!options?.paginate) {
    const [rows] = await getExecutor(executor).query(baseSql, values);
    return rows;
  }

  const [[countRow]] = await getExecutor(executor).query(
    `SELECT COUNT(*) AS total
     FROM hub_membership hm
     INNER JOIN hubs h ON h.hub_id = hm.hub_id
     WHERE ${clauses.join(" AND ")}`,
    values
  );
  const paginated = appendPaginationClause(baseSql, values, options);
  const [rows] = await getExecutor(executor).query(paginated.sql, paginated.values);
  return {
    rows,
    total: Number(countRow?.total) || 0
  };
};

const updateHubMembership = async (membershipId, payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE hub_membership
     SET notes = ?
     WHERE hub_membership_id = ?`,
    [payload.notes || null, membershipId]
  );
  return result;
};

const leaveHubMembership = async (membershipId, payload = {}, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE hub_membership
     SET
       status = 'LEFT',
       leave_date = NOW(),
       notes = COALESCE(?, notes)
     WHERE hub_membership_id = ?
       AND status = 'ACTIVE'`,
    [payload.notes || null, membershipId]
  );
  return result;
};

const getActiveHubMembershipCountsByStudent = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       h.hub_priority,
       COUNT(*) AS membership_count
     FROM hub_membership hm
     INNER JOIN hubs h ON h.hub_id = hm.hub_id
     WHERE hm.student_id = ?
       AND hm.status = 'ACTIVE'
       AND h.status = 'ACTIVE'
     GROUP BY h.hub_priority`,
    [studentId]
  );
  return rows;
};

const findActiveAllowedHubMembershipForEvent = async (studentId, eventId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       hm.hub_membership_id,
       hm.student_id,
       hm.hub_id,
       h.hub_code,
       h.hub_name,
       h.hub_priority
     FROM hub_membership hm
     INNER JOIN hubs h ON h.hub_id = hm.hub_id
     INNER JOIN event_hub_access eha ON eha.hub_id = h.hub_id
     WHERE hm.student_id = ?
       AND hm.status = 'ACTIVE'
       AND h.status = 'ACTIVE'
       AND eha.event_id = ?
     ORDER BY hm.join_date ASC, hm.hub_membership_id ASC
     LIMIT 1`,
    [studentId, eventId]
  );
  return rows[0] || null;
};

module.exports = {
  createHub,
  getAllHubs,
  getHubById,
  lockHubById,
  getHubByCode,
  getHubsByIds,
  updateHub,
  setHubStatus,
  getStudentById,
  getStudentByUserId,
  createHubMembership,
  getHubMembershipById,
  lockHubMembershipById,
  findActiveHubMembershipByHubAndStudent,
  getHubMembershipsByHubId,
  getAllHubMemberships,
  updateHubMembership,
  leaveHubMembership,
  getActiveHubMembershipCountsByStudent,
  findActiveAllowedHubMembershipForEvent
};
