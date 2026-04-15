const db = require("../../config/db");

const getExecutor = (executor) => executor || db;

const createInvitation = async (payload, executor) => {
  const [result] = await getExecutor(executor).query(
    `INSERT INTO event_team_invitations
      (
        event_id,
        team_id,
        inviter_student_id,
        invitee_student_id,
        proposed_role,
        status
      )
     VALUES (?, ?, ?, ?, ?, 'PENDING')`,
    [
      payload.event_id,
      payload.team_id,
      payload.inviter_student_id,
      payload.invitee_student_id,
      payload.proposed_role || "MEMBER"
    ]
  );
  return result;
};

const findPendingByTeamAndInvitee = async (teamId, inviteeStudentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT invitation_id, team_id, invitee_student_id, status
     FROM event_team_invitations
     WHERE team_id = ?
       AND invitee_student_id = ?
       AND status = 'PENDING'
     LIMIT 1`,
    [teamId, inviteeStudentId]
  );
  return rows[0] || null;
};

const expirePendingForStudent = async (studentId, executor) => {
  const [result] = await getExecutor(executor).query(
    `UPDATE event_team_invitations eti
     INNER JOIN events e ON e.event_id = eti.event_id
     SET
       eti.status = 'EXPIRED',
       eti.responded_at = NOW(),
       eti.response_note = COALESCE(eti.response_note, 'Registration deadline ended')
     WHERE eti.invitee_student_id = ?
       AND eti.status = 'PENDING'
       AND e.registration_end_date IS NOT NULL
       AND CURRENT_DATE() > e.registration_end_date`,
    [studentId]
  );
  return result;
};

const findByStudent = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       eti.invitation_id,
       eti.event_id,
       eti.team_id,
       eti.inviter_student_id,
       eti.invitee_student_id,
       eti.proposed_role,
       eti.status,
       eti.sent_at,
       eti.responded_at,
       eti.response_note,
       t.team_code,
       t.team_name,
       t.team_type,
       t.status AS team_status,
       t.rounds_cleared,
       e.event_code,
       e.event_name,
       e.status AS event_status,
       e.registration_start_date,
       e.registration_end_date,
       s.name AS inviter_name,
       s.email AS inviter_email
     FROM event_team_invitations eti
     INNER JOIN teams t ON t.team_id = eti.team_id
     INNER JOIN events e ON e.event_id = eti.event_id
     INNER JOIN students s ON s.student_id = eti.inviter_student_id
     WHERE eti.invitee_student_id = ?
     ORDER BY
       CASE eti.status
         WHEN 'PENDING' THEN 1
         WHEN 'ACCEPTED' THEN 2
         WHEN 'REJECTED' THEN 3
         WHEN 'EXPIRED' THEN 4
         WHEN 'CANCELLED' THEN 5
         ELSE 6
       END,
       eti.sent_at DESC,
       eti.invitation_id DESC`,
    [studentId]
  );
  return rows;
};

const findByIdForUpdate = async (conn, invitationId) => {
  const [rows] = await conn.query(
    `SELECT
       eti.invitation_id,
       eti.event_id,
       eti.team_id,
       eti.inviter_student_id,
       eti.invitee_student_id,
       eti.proposed_role,
       eti.status,
       eti.sent_at,
       eti.responded_at,
       eti.response_note,
       t.team_code,
       t.team_name,
       t.team_type,
       t.status AS team_status,
       t.rounds_cleared,
       e.event_code,
       e.event_name,
       e.status AS event_status,
       e.registration_start_date,
       e.registration_end_date,
       e.max_members AS event_max_members
     FROM event_team_invitations eti
     INNER JOIN teams t ON t.team_id = eti.team_id
     INNER JOIN events e ON e.event_id = eti.event_id
     WHERE eti.invitation_id = ?
     LIMIT 1
     FOR UPDATE`,
    [invitationId]
  );
  return rows[0] || null;
};

const updateInvitationResponseTx = async (conn, invitationId, status, responseNote = null) => {
  await conn.query(
    `UPDATE event_team_invitations
     SET
       status = ?,
       response_note = ?,
       responded_at = NOW()
     WHERE invitation_id = ?`,
    [status, responseNote, invitationId]
  );
};

module.exports = {
  createInvitation,
  findPendingByTeamAndInvitee,
  expirePendingForStudent,
  findByStudent,
  findByIdForUpdate,
  updateInvitationResponseTx
};
