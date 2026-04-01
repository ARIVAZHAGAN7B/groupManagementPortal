const db = require("../../config/db");

const getExecutor = (executor) => executor || db;
const PHASE_END_AT_EXPR = "TIMESTAMP(p.end_date, COALESCE(p.end_time, '23:59:59'))";

const buildInClause = (values = []) =>
  Array.from({ length: values.length }, () => "?").join(", ");

const buildMembershipListFilter = (filters = {}) => {
  const clauses = ["1=1"];
  const values = [];

  if (filters.status) {
    clauses.push("m.status = ?");
    values.push(String(filters.status).trim().toUpperCase());
  }

  if (filters.group_id !== undefined && filters.group_id !== null && filters.group_id !== "") {
    clauses.push("m.group_id = ?");
    values.push(Number(filters.group_id));
  }

  if (filters.student_id) {
    clauses.push("m.student_id = ?");
    values.push(String(filters.student_id).trim());
  }

  if (filters.role) {
    clauses.push("m.role = ?");
    values.push(String(filters.role).trim().toUpperCase());
  }

  return {
    whereClause: clauses.join(" AND "),
    values
  };
};

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

const getGroupMembers = async (groupId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       m.membership_id,
       m.student_id,
       m.group_id,
       m.role,
       m.member_rank_override,
       m.join_date,
       u.name,
       u.email,
       COALESCE(gspt.group_base_points_earned, gpt.membership_base_points_earned, 0) AS base_points_earned,
       COALESCE(gspt.group_base_points_earned, 0) AS group_base_points_earned,
       COALESCE(gpt.membership_base_points_earned, 0) AS membership_base_points_earned,
       lgr.review_phase_id AS latest_rank_review_phase_id,
       rp.phase_name AS latest_rank_review_phase_name,
       lgr.review_cycle_number AS latest_rank_review_cycle_number,
       lgr.loyalty_phase_count AS latest_rank_loyalty_phase_count,
       lgr.loyalty_rank AS latest_rank_loyalty_rank,
       lgr.loyalty_score AS latest_rank_loyalty_score,
       lgr.contribution_points AS latest_rank_contribution_points,
       lgr.contribution_rank AS latest_rank_contribution_rank,
       lgr.contribution_score AS latest_rank_contribution_score,
       lgr.reliability_eligible_phase_count AS latest_rank_reliability_eligible_phase_count,
       lgr.reliability_rank AS latest_rank_reliability_rank,
       lgr.reliability_score AS latest_rank_reliability_score,
       lgr.total_score AS latest_rank_total_score,
       lgr.overall_rank AS latest_rank_overall_rank,
       lgr.previous_overall_rank AS latest_previous_overall_rank,
       lgr.rank_movement AS latest_rank_movement,
       lgr.reviewed_at AS latest_rank_reviewed_at
     FROM memberships m
     JOIN students u ON u.student_id = m.student_id
     LEFT JOIN (
       SELECT gp.membership_id, SUM(gp.points) AS membership_base_points_earned
       FROM group_points gp
       GROUP BY gp.membership_id
     ) gpt ON gpt.membership_id = m.membership_id
     LEFT JOIN (
       SELECT gp.group_id, gp.student_id, SUM(gp.points) AS group_base_points_earned
       FROM group_points gp
       GROUP BY gp.group_id, gp.student_id
     ) gspt ON gspt.group_id = m.group_id AND gspt.student_id = m.student_id
     LEFT JOIN (
       SELECT gr.*
       FROM group_rank gr
       INNER JOIN (
         SELECT membership_id, MAX(group_rank_id) AS latest_group_rank_id
         FROM group_rank
         GROUP BY membership_id
       ) latest
         ON latest.membership_id = gr.membership_id
        AND latest.latest_group_rank_id = gr.group_rank_id
     ) lgr ON lgr.membership_id = m.membership_id
     LEFT JOIN phases rp ON rp.phase_id = lgr.review_phase_id
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

const updateMemberRank = async (membershipId, rank, executor) => {
  return getExecutor(executor).query(
    "UPDATE memberships SET member_rank_override=? WHERE membership_id=?",
    [rank, membershipId]
  );
};

const getGroupRankRules = async (executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       rule_id,
       rule_code,
       rule_name,
       scope_type,
       rank_4_min_value,
       rank_3_min_value,
       rank_2_min_value,
       rank_1_min_value,
       score_weight,
       is_active
     FROM group_rank_rules
     WHERE is_active = 1
     ORDER BY FIELD(rule_code, 'LOYALTY', 'CONTRIBUTION', 'RELIABILITY'), rule_id ASC`
  );

  return rows;
};

const getGroupRankRuleOverrides = async (groupId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       group_rank_rule_override_id,
       group_id,
       rule_code,
       rank_4_min_value,
       rank_3_min_value,
       rank_2_min_value,
       rank_1_min_value,
       score_weight,
       updated_by_membership_id,
       created_at,
       updated_at
     FROM group_rank_rule_overrides
     WHERE group_id = ?
     ORDER BY FIELD(rule_code, 'LOYALTY', 'CONTRIBUTION', 'RELIABILITY'), group_rank_rule_override_id ASC`,
    [Number(groupId)]
  );

  return rows;
};

const upsertGroupRankRuleOverrides = async (
  groupId,
  rulesByCode = {},
  updatedByMembershipId = null,
  executor
) => {
  const entries = Object.entries(rulesByCode || {});
  if (entries.length === 0) return;

  const placeholders = entries
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?)")
    .join(", ");

  const values = entries.flatMap(([ruleCode, rule]) => [
    Number(groupId),
    String(ruleCode).toUpperCase(),
    Number(rule.rank_4_min_value),
    Number(rule.rank_3_min_value),
    Number(rule.rank_2_min_value),
    Number(rule.rank_1_min_value),
    Number(rule.score_weight) || 1,
    updatedByMembershipId === null || updatedByMembershipId === undefined
      ? null
      : Number(updatedByMembershipId)
  ]);

  await getExecutor(executor).query(
    `INSERT INTO group_rank_rule_overrides
      (
        group_id,
        rule_code,
        rank_4_min_value,
        rank_3_min_value,
        rank_2_min_value,
        rank_1_min_value,
        score_weight,
        updated_by_membership_id
      )
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       rank_4_min_value = VALUES(rank_4_min_value),
       rank_3_min_value = VALUES(rank_3_min_value),
       rank_2_min_value = VALUES(rank_2_min_value),
       rank_1_min_value = VALUES(rank_1_min_value),
       score_weight = VALUES(score_weight),
       updated_by_membership_id = VALUES(updated_by_membership_id)`,
    values
  );
};

const clearGroupRankRuleOverrides = async (groupId, executor) => {
  await getExecutor(executor).query(
    `DELETE FROM group_rank_rule_overrides
     WHERE group_id = ?`,
    [Number(groupId)]
  );
};

const countActiveLeadershipRoles = async (groupId, executor) => {
  const [[row]] = await getExecutor(executor).query(
    `SELECT COUNT(*) AS total
     FROM memberships
     WHERE group_id = ?
       AND status = 'ACTIVE'
       AND role IN ('CAPTAIN', 'VICE_CAPTAIN', 'STRATEGIST', 'MANAGER')`,
    [Number(groupId)]
  );

  return Number(row?.total) || 0;
};

const hasGroupRankReviewForPhase = async (phaseId, executor) => {
  const [[row]] = await getExecutor(executor).query(
    `SELECT COUNT(*) AS total
     FROM group_rank
     WHERE review_phase_id = ?`,
    [phaseId]
  );

  return Number(row?.total) > 0;
};

const getMembershipsActiveAt = async (reviewAt, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       m.membership_id,
       m.student_id,
       m.group_id,
       m.role,
       m.join_date,
       m.leave_date,
       m.status
     FROM memberships m
     WHERE m.join_date <= ?
       AND (m.leave_date IS NULL OR m.leave_date > ?)
     ORDER BY m.group_id ASC, m.join_date ASC, m.membership_id ASC`,
    [reviewAt, reviewAt]
  );

  return rows;
};

const getMembershipContributionTotals = async (membershipIds, reviewAt, executor) => {
  if (!Array.isArray(membershipIds) || membershipIds.length === 0) {
    return [];
  }

  const placeholders = buildInClause(membershipIds);
  const [rows] = await getExecutor(executor).query(
    `SELECT
       gp.membership_id,
       COALESCE(SUM(gp.points), 0) AS contribution_points
     FROM group_points gp
     WHERE gp.created_at <= ?
       AND gp.membership_id IN (${placeholders})
     GROUP BY gp.membership_id`,
    [reviewAt, ...membershipIds]
  );

  return rows;
};

const getMembershipLoyaltyCounts = async (membershipIds, reviewAt, executor) => {
  if (!Array.isArray(membershipIds) || membershipIds.length === 0) {
    return [];
  }

  const placeholders = buildInClause(membershipIds);
  const [rows] = await getExecutor(executor).query(
    `SELECT
       m.membership_id,
       COUNT(p.phase_id) AS loyalty_phase_count
     FROM memberships m
     LEFT JOIN phases p
       ON p.status = 'COMPLETED'
      AND ${PHASE_END_AT_EXPR} <= ?
      AND ${PHASE_END_AT_EXPR} >= m.join_date
      AND (m.leave_date IS NULL OR ${PHASE_END_AT_EXPR} < m.leave_date)
     WHERE m.membership_id IN (${placeholders})
     GROUP BY m.membership_id`,
    [reviewAt, ...membershipIds]
  );

  return rows;
};

const getStudentReliabilityCounts = async (studentIds, reviewAt, executor) => {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return [];
  }

  const placeholders = buildInClause(studentIds);
  const [rows] = await getExecutor(executor).query(
    `SELECT
       ie.student_id,
       COUNT(*) AS reliability_eligible_phase_count
     FROM individual_eligibility ie
     INNER JOIN phases p
       ON p.phase_id = ie.phase_id
      AND p.status = 'COMPLETED'
     WHERE ie.is_eligible = 1
       AND ${PHASE_END_AT_EXPR} <= ?
       AND ie.student_id IN (${placeholders})
     GROUP BY ie.student_id`,
    [reviewAt, ...studentIds]
  );

  return rows;
};

const getLatestGroupRanksByMembershipIds = async (membershipIds, executor) => {
  if (!Array.isArray(membershipIds) || membershipIds.length === 0) {
    return [];
  }

  const placeholders = buildInClause(membershipIds);
  const [rows] = await getExecutor(executor).query(
    `SELECT gr.*
     FROM group_rank gr
     INNER JOIN (
       SELECT membership_id, MAX(group_rank_id) AS latest_group_rank_id
       FROM group_rank
       WHERE membership_id IN (${placeholders})
       GROUP BY membership_id
     ) latest
       ON latest.membership_id = gr.membership_id
      AND latest.latest_group_rank_id = gr.group_rank_id`,
    membershipIds
  );

  return rows;
};

const getLatestGroupRanksByMembershipIdsBeforeCycle = async (
  membershipIds,
  reviewCycleNumber,
  executor
) => {
  if (!Array.isArray(membershipIds) || membershipIds.length === 0) {
    return [];
  }

  const placeholders = buildInClause(membershipIds);
  const [rows] = await getExecutor(executor).query(
    `SELECT gr.*
     FROM group_rank gr
     INNER JOIN (
       SELECT membership_id, MAX(group_rank_id) AS latest_group_rank_id
       FROM group_rank
       WHERE membership_id IN (${placeholders})
         AND review_cycle_number < ?
       GROUP BY membership_id
     ) latest
       ON latest.membership_id = gr.membership_id
      AND latest.latest_group_rank_id = gr.group_rank_id`,
    [...membershipIds, Number(reviewCycleNumber)]
  );

  return rows;
};

const upsertGroupRankRows = async (rows, executor) => {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const placeholders = rows
    .map(
      () =>
        "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
    )
    .join(", ");

  const values = rows.flatMap((row) => [
    row.review_phase_id,
    Number(row.review_cycle_number),
    Number(row.group_id),
    Number(row.membership_id),
    row.student_id,
    row.membership_role,
    Number(row.loyalty_phase_count) || 0,
    Number(row.loyalty_rank) || 5,
    Number(row.loyalty_score) || 0,
    Number(row.contribution_points) || 0,
    Number(row.contribution_rank) || 5,
    Number(row.contribution_score) || 0,
    Number(row.reliability_eligible_phase_count) || 0,
    Number(row.reliability_rank) || 5,
    Number(row.reliability_score) || 0,
    Number(row.total_score) || 0,
    Number(row.overall_rank) || 5,
    row.previous_overall_rank === null || row.previous_overall_rank === undefined
      ? null
      : Number(row.previous_overall_rank),
    row.rank_movement || "NEW",
    row.evaluation_basis || "PHASE_REVIEW"
  ]);

  await getExecutor(executor).query(
    `INSERT INTO group_rank
      (
        review_phase_id,
        review_cycle_number,
        group_id,
        membership_id,
        student_id,
        membership_role,
        loyalty_phase_count,
        loyalty_rank,
        loyalty_score,
        contribution_points,
        contribution_rank,
        contribution_score,
        reliability_eligible_phase_count,
        reliability_rank,
        reliability_score,
        total_score,
        overall_rank,
        previous_overall_rank,
        rank_movement,
        evaluation_basis,
        reviewed_at
      )
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       membership_role = VALUES(membership_role),
       loyalty_phase_count = VALUES(loyalty_phase_count),
       loyalty_rank = VALUES(loyalty_rank),
       loyalty_score = VALUES(loyalty_score),
       contribution_points = VALUES(contribution_points),
       contribution_rank = VALUES(contribution_rank),
       contribution_score = VALUES(contribution_score),
       reliability_eligible_phase_count = VALUES(reliability_eligible_phase_count),
       reliability_rank = VALUES(reliability_rank),
       reliability_score = VALUES(reliability_score),
       total_score = VALUES(total_score),
       overall_rank = VALUES(overall_rank),
       previous_overall_rank = VALUES(previous_overall_rank),
       rank_movement = VALUES(rank_movement),
       evaluation_basis = VALUES(evaluation_basis),
       reviewed_at = VALUES(reviewed_at)`,
    values
  );
};

const getGroupRankHistory = async (groupId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT
       gr.group_rank_id,
       gr.review_phase_id,
       p.phase_name,
       p.start_date AS phase_start_date,
       p.end_date AS phase_end_date,
       gr.review_cycle_number,
       gr.group_id,
       gr.membership_id,
       gr.student_id,
       s.name AS student_name,
       gr.membership_role,
       gr.loyalty_phase_count,
       gr.loyalty_rank,
       gr.loyalty_score,
       gr.contribution_points,
       gr.contribution_rank,
       gr.contribution_score,
       gr.reliability_eligible_phase_count,
       gr.reliability_rank,
       gr.reliability_score,
       gr.total_score,
       gr.overall_rank,
       gr.previous_overall_rank,
       gr.rank_movement,
       gr.evaluation_basis,
       gr.reviewed_at
     FROM group_rank gr
     LEFT JOIN phases p ON p.phase_id = gr.review_phase_id
     LEFT JOIN students s ON s.student_id = gr.student_id
     WHERE gr.group_id = ?
     ORDER BY
       gr.review_cycle_number DESC,
       gr.overall_rank ASC,
       gr.total_score DESC,
       gr.membership_id ASC`,
    [groupId]
  );

  return rows;
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
  return rows[0];
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
        COALESCE(gpt.lifetime_base_points, 0) AS lifetime_base_points,
        COALESCE(gept.total_points, 0) AS eligibility_bonus_points,
        COALESCE(gpt.lifetime_base_points, 0) + COALESCE(gept.total_points, 0) AS lifetime_total_points,
        COALESCE(mc.member_count, 0) AS member_count
     FROM memberships m
     JOIN Sgroup g ON g.group_id = m.group_id
     LEFT JOIN (
       SELECT group_id, COALESCE(SUM(points), 0) AS lifetime_base_points
       FROM group_points
       GROUP BY group_id
     ) gpt
       ON gpt.group_id = m.group_id
     LEFT JOIN group_eligibility_point_totals gept
       ON gept.group_id = m.group_id
     LEFT JOIN (
       SELECT group_id, COUNT(*) AS member_count
       FROM memberships
       WHERE status = 'ACTIVE'
       GROUP BY group_id
     ) mc
       ON mc.group_id = m.group_id
     WHERE m.student_id=? AND m.status='ACTIVE'
     LIMIT 1`,
    [studentId]
  );
  return rows[0];
};

const findLatestLeftMembershipByStudent = async (studentId, executor) => {
  const [rows] = await getExecutor(executor).query(
    `SELECT membership_id, student_id, group_id, role, status, join_date, leave_date
     FROM memberships
     WHERE student_id=?
       AND status='LEFT'
       AND leave_date IS NOT NULL
     ORDER BY leave_date DESC, membership_id DESC
     LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
};

const getAllMemberships = async (filters = {}, options = {}, executor) => {
  const exec = getExecutor(executor);
  const { whereClause, values } = buildMembershipListFilter(filters);
  const selectSql = `
    SELECT
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
      s.year,
      g.group_code,
      g.group_name,
      g.tier AS group_tier,
      g.status AS group_status
    FROM memberships m
    LEFT JOIN students s ON s.student_id = m.student_id
    LEFT JOIN Sgroup g ON g.group_id = m.group_id
    WHERE ${whereClause}
  `;
  const orderSql = `
    ORDER BY
      CASE WHEN m.status = 'ACTIVE' THEN 0 ELSE 1 END,
      m.join_date DESC,
      m.membership_id DESC
  `;

  if (!options?.paginate) {
    const [rows] = await exec.query(`${selectSql} ${orderSql}`, values);
    return rows;
  }

  const limit = Math.max(1, Number(options.limit) || 50);
  const offset = Math.max(0, Number(options.offset) || 0);
  const [[countRow]] = await exec.query(
    `SELECT COUNT(*) AS total
     FROM memberships m
     WHERE ${whereClause}`,
    values
  );
  const [rows] = await exec.query(
    `${selectSql}
     ${orderSql}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return {
    rows,
    total: Number(countRow?.total) || 0
  };
};

module.exports = {
  findActiveMembershipByStudent,
  createMembership,
  countGroupMembers,
  updateGroupStatus,
  leaveMembership,
  getGroupMembers,
  updateRole,
  updateMemberRank,
  getGroupRankRules,
  getGroupRankRuleOverrides,
  upsertGroupRankRuleOverrides,
  clearGroupRankRuleOverrides,
  countActiveLeadershipRoles,
  hasGroupRankReviewForPhase,
  getMembershipsActiveAt,
  getMembershipContributionTotals,
  getMembershipLoyaltyCounts,
  getStudentReliabilityCounts,
  getLatestGroupRanksByMembershipIds,
  getLatestGroupRanksByMembershipIdsBeforeCycle,
  upsertGroupRankRows,
  getGroupRankHistory,
  findActiveMembershipByStudentAndGroup,
  leaveMembershipByStudentAndGroup,
  getMembershipById,
  findLatestLeftMembershipByStudent,
  findActiveCaptainInGroup,
  getActiveMembershipWithGroupByStudent,
  getAllMemberships
};
