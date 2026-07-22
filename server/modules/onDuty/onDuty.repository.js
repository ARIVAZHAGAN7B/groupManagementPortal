const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const REQUEST_SELECT = `
  SELECT
    odr.od_request_id,
    odr.event_id,
    odr.round_id,
    odr.team_id,
    odr.requested_by_student_id,
    odr.requested_from_date,
    odr.requested_to_date,
    odr.requested_day_count,
    odr.shortlist_proof_path,
    odr.shortlist_proof_name,
    odr.shortlist_proof_type,
    odr.shortlist_proof_uploaded_at,
    odr.faculty_status,
    odr.hod_status,
    odr.admin_status,
    odr.faculty_notes,
    odr.hod_notes,
    odr.admin_notes,
    odr.reviewed_by_user_id,
    odr.reviewed_at,
    odr.created_at,
    odr.updated_at,
    e.event_code,
    e.event_name,
    e.registration_mode,
    er.round_order,
    er.round_name,
    er.round_date,
    er.round_end_date,
    er.start_time,
    er.end_time,
    er.round_mode,
    er.location AS round_location,
    er.status AS round_status,
    t.team_code,
    t.team_name,
    t.status AS team_status,
    t.rounds_cleared,
    s.name AS requested_by_student_name,
    s.department AS requested_by_student_department,
    s.year AS requested_by_student_year
  FROM on_duty_requests odr
  INNER JOIN events e
    ON e.event_id = odr.event_id
  INNER JOIN event_rounds er
    ON er.round_id = odr.round_id
  INNER JOIN teams t
    ON t.team_id = odr.team_id
  INNER JOIN students s
    ON s.student_id = odr.requested_by_student_id
`;

const applyFilters = (filters = {}) => {
  const clauses = ["1=1"];
  const values = [];

  if (filters.event_id) {
    clauses.push("odr.event_id = ?");
    values.push(Number(filters.event_id));
  }

  if (filters.round_id) {
    clauses.push("odr.round_id = ?");
    values.push(Number(filters.round_id));
  }

  if (filters.team_id) {
    clauses.push("odr.team_id = ?");
    values.push(Number(filters.team_id));
  }

  if (filters.admin_status) {
    clauses.push("odr.admin_status = ?");
    values.push(String(filters.admin_status).trim().toUpperCase());
  }

  if (filters.requested_by_student_id) {
    clauses.push("odr.requested_by_student_id = ?");
    values.push(String(filters.requested_by_student_id).trim());
  }

  if (filters.search) {
    const pattern = `%${String(filters.search).trim().toLowerCase()}%`;
    clauses.push(
      `(
        LOWER(e.event_name) LIKE ?
        OR LOWER(e.event_code) LIKE ?
        OR LOWER(er.round_name) LIKE ?
        OR LOWER(t.team_name) LIKE ?
        OR LOWER(t.team_code) LIKE ?
        OR LOWER(s.name) LIKE ?
        OR LOWER(s.student_id) LIKE ?
      )`
    );
    values.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
  }

  return { clauses, values };
};

const listRequests = async (filters = {}, executor) => {
  const { clauses, values } = applyFilters(filters);
  const [rows] = await getExecutor(executor).query(
    `${REQUEST_SELECT}
     WHERE ${clauses.join(" AND ")}
     ORDER BY er.round_date ASC, er.round_order ASC, odr.created_at DESC, odr.od_request_id DESC`,
    values
  );
  return rows;
};

const getRequestById = async (odRequestId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${REQUEST_SELECT}
     WHERE odr.od_request_id = ?
     LIMIT 1`,
    [Number(odRequestId)]
  );
  return rows[0] || null;
};

const lockRequestById = async (odRequestId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${REQUEST_SELECT}
     WHERE odr.od_request_id = ?
     LIMIT 1
     FOR UPDATE`,
    [Number(odRequestId)]
  );
  return rows[0] || null;
};

const getRequestByRoundAndTeam = async (roundId, teamId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${REQUEST_SELECT}
     WHERE odr.round_id = ? AND odr.team_id = ?
     LIMIT 1`,
    [Number(roundId), Number(teamId)]
  );
  return rows[0] || null;
};

const lockRequestByRoundAndTeam = async (roundId, teamId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${REQUEST_SELECT}
     WHERE odr.round_id = ? AND odr.team_id = ?
     LIMIT 1
     FOR UPDATE`,
    [Number(roundId), Number(teamId)]
  );
  return rows[0] || null;
};

const getRequestsByTeamId = async (teamId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${REQUEST_SELECT}
     WHERE odr.team_id = ?
     ORDER BY er.round_order ASC, odr.created_at DESC, odr.od_request_id DESC`,
    [Number(teamId)]
  );
  return rows;
};

const getRequestsByStudentId = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `${REQUEST_SELECT}
     INNER JOIN team_membership tm
       ON tm.team_id = odr.team_id
      AND tm.student_id = ?
      AND tm.status = 'ACTIVE'
     ORDER BY er.round_date ASC, er.round_order ASC, odr.created_at DESC, odr.od_request_id DESC`,
    [String(studentId || "").trim()]
  );
  return rows;
};

const createRequest = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO on_duty_requests
      (
        event_id,
        round_id,
        team_id,
        requested_by_student_id,
        requested_from_date,
        requested_to_date,
        requested_day_count,
        shortlist_proof_path,
        shortlist_proof_name,
        shortlist_proof_type,
        shortlist_proof_uploaded_at,
        faculty_status,
        hod_status,
        admin_status,
        faculty_notes,
        hod_notes,
        admin_notes,
        reviewed_by_user_id,
        reviewed_at
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.event_id,
      payload.round_id,
      payload.team_id,
      payload.requested_by_student_id,
      payload.requested_from_date,
      payload.requested_to_date,
      payload.requested_day_count,
      payload.shortlist_proof_path || null,
      payload.shortlist_proof_name || null,
      payload.shortlist_proof_type || null,
      payload.shortlist_proof_uploaded_at || null,
      payload.faculty_status || "PENDING",
      payload.hod_status || "PENDING",
      payload.admin_status || "PENDING",
      payload.faculty_notes || null,
      payload.hod_notes || null,
      payload.admin_notes || null,
      payload.reviewed_by_user_id || null,
      payload.reviewed_at || null
    ]
  );
  return result;
};

const resubmitRequest = async (odRequestId, payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE on_duty_requests
     SET
       requested_by_student_id = ?,
       requested_from_date = ?,
       requested_to_date = ?,
       requested_day_count = ?,
       shortlist_proof_path = ?,
       shortlist_proof_name = ?,
       shortlist_proof_type = ?,
       shortlist_proof_uploaded_at = ?,
       faculty_status = 'PENDING',
       hod_status = 'PENDING',
       admin_status = 'PENDING',
       faculty_notes = NULL,
       hod_notes = NULL,
       admin_notes = NULL,
       reviewed_by_user_id = NULL,
       reviewed_at = NULL
     WHERE od_request_id = ?`,
    [
      payload.requested_by_student_id,
      payload.requested_from_date,
      payload.requested_to_date,
      payload.requested_day_count,
      payload.shortlist_proof_path || null,
      payload.shortlist_proof_name || null,
      payload.shortlist_proof_type || null,
      payload.shortlist_proof_uploaded_at || null,
      Number(odRequestId)
    ]
  );
  return result;
};

const reviewRequest = async (odRequestId, payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE on_duty_requests
     SET
       faculty_status = ?,
       hod_status = ?,
       admin_status = ?,
       faculty_notes = ?,
       hod_notes = ?,
       admin_notes = ?,
       reviewed_by_user_id = ?,
       reviewed_at = NOW()
     WHERE od_request_id = ?`,
    [
      payload.faculty_status,
      payload.hod_status,
      payload.admin_status,
      payload.faculty_notes || null,
      payload.hod_notes || null,
      payload.admin_notes || null,
      payload.reviewed_by_user_id || null,
      Number(odRequestId)
    ]
  );
  return result;
};

module.exports = {
  listRequests,
  getRequestById,
  lockRequestById,
  getRequestByRoundAndTeam,
  lockRequestByRoundAndTeam,
  getRequestsByTeamId,
  getRequestsByStudentId,
  createRequest,
  resubmitRequest,
  reviewRequest
};
