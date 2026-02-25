const db = require("../../config/db");

const findActiveMembershipByStudent = async (studentId) => {
  const [rows] = await db.query(
    "SELECT * FROM memberships WHERE student_id=? AND status='ACTIVE'",
    [studentId]
  );
  return rows;
};

const createMembership = async (student_id, groupId, role = "MEMBER") => {
  return db.query(
    "INSERT INTO memberships (student_id, group_id, role) VALUES (?,?,?)",
    [student_id, groupId, role]
  );
};

const countGroupMembers = async (groupId) => {
  const [[row]] = await db.query(
    "SELECT COUNT(*) AS count FROM memberships WHERE group_id=? AND status='ACTIVE'",
    [groupId]
  );
  return row.count;
};

const updateGroupStatus = async (groupId, status) => {
  return db.query(
    "UPDATE Sgroup SET status=? WHERE group_id=?",
    [status, groupId]
  );
};

const leaveMembership = async (membershipId) => {
  return db.query(
    "UPDATE memberships SET status='LEFT', leave_date=NOW() WHERE membership_id=?",
    [membershipId]
  );
};

const getGroupMembers = async (groupId) => {
  console.log("Fetching members for groupId:", groupId);
  const [rows] = await db.query(
    `SELECT m.membership_id, m.student_id, m.role, m.join_date, u.name, u.email
     FROM memberships m
     JOIN students u ON u.student_id = m.student_id
     WHERE m.group_id=? AND m.status='ACTIVE'`,
    [groupId]
  );
  return rows;
};

const updateRole = async (membershipId, role) => {
  return db.query(
    "UPDATE memberships SET role=? WHERE membership_id=?",
    [role, membershipId]
  );
};

const findActiveMembershipByStudentAndGroup = async (studentId, groupId) => {
  const [rows] = await db.query(
    "SELECT * FROM memberships WHERE student_id=? AND group_id=? AND status='ACTIVE' LIMIT 1",
    [studentId, groupId]
  );
  return rows[0];
};

const leaveMembershipByStudentAndGroup = async (studentId, groupId) => {
  return db.query(
    "UPDATE memberships SET status='LEFT', leave_date=NOW() WHERE student_id=? AND group_id=? AND status='ACTIVE'",
    [studentId, groupId]
  );
};

const getMembershipById = async (membershipId) => {
  const [rows] = await db.query(
    "SELECT * FROM memberships WHERE membership_id=?",
    [membershipId]
  );
  return rows[0];
};

const findActiveCaptainInGroup = async (groupId) => {
  const [rows] = await db.query(
    "SELECT membership_id FROM memberships WHERE group_id=? AND role='CAPTAIN' AND status='ACTIVE' LIMIT 1",
    [groupId]
  );
  return rows[0]; // or undefined
};

const getActiveMembershipWithGroupByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT 
        m.membership_id,
        m.student_id,
        m.group_id,
        m.role,
        m.join_date,
        m.incubation_end_date,
        m.status AS membership_status,
        g.group_code,
        g.group_name,
        g.tier,
        g.status AS group_status,
        (
          SELECT COUNT(*)
          FROM memberships m2
          WHERE m2.group_id = m.group_id AND m2.status='ACTIVE'
        ) AS member_count
     FROM memberships m
     JOIN Sgroup g ON g.group_id = m.group_id
     WHERE m.student_id=? AND m.status='ACTIVE'
     LIMIT 1`,
    [studentId]
  );
  return rows[0];
};

const getAllMemberships = async () => {
  const [rows] = await db.query(
    `SELECT
       m.membership_id,
       m.student_id,
       m.group_id,
       m.role,
       m.status AS membership_status,
       m.join_date,
       m.leave_date,
       m.incubation_end_date,
       s.name AS student_name,
       s.email AS student_email,
       g.group_code,
       g.group_name,
       g.tier AS group_tier,
       g.status AS group_status
     FROM memberships m
     LEFT JOIN students s ON s.student_id = m.student_id
     LEFT JOIN Sgroup g ON g.group_id = m.group_id
     ORDER BY
       CASE WHEN m.status = 'ACTIVE' THEN 0 ELSE 1 END,
       m.join_date DESC,
       m.membership_id DESC`
  );
  return rows;
};

module.exports = {
  findActiveMembershipByStudent,
  createMembership,
  countGroupMembers,
  updateGroupStatus,
  leaveMembership,
  getGroupMembers,
  findActiveMembershipByStudentAndGroup,
  leaveMembershipByStudentAndGroup,
  updateRole,
  getMembershipById,
  findActiveCaptainInGroup,
  getActiveMembershipWithGroupByStudent,
  getAllMemberships
};
