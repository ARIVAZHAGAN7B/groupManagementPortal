const db = require("../../config/db");

const GROUP_OVERVIEW_SELECT = `
  SELECT
    g.group_id,
    g.group_code,
    g.group_name,
    g.tier,
    g.status,
    COALESCE(mc.active_member_count, 0) AS active_member_count,
    COALESCE(ap.total_points, 0) AS total_points,
    COALESCE(lp.lifetime_base_points, 0) AS lifetime_base_points,
    COALESCE(geb.eligibility_bonus_points, 0) AS eligibility_bonus_points,
    COALESCE(lp.lifetime_base_points, 0) + COALESCE(geb.eligibility_bonus_points, 0) AS lifetime_total_points,
    captain.leader_name,
    captain.leader_roll_number,
    COALESCE(captain.captain_points, 0) AS captain_points
  FROM Sgroup g
  LEFT JOIN (
    SELECT group_id, COUNT(*) AS active_member_count
    FROM memberships
    WHERE status = 'ACTIVE'
    GROUP BY group_id
  ) mc
    ON mc.group_id = g.group_id
  LEFT JOIN (
    SELECT gp.group_id, COALESCE(SUM(gp.points), 0) AS total_points
    FROM group_points gp
    INNER JOIN memberships m
      ON m.membership_id = gp.membership_id
     AND m.status = 'ACTIVE'
    GROUP BY gp.group_id
  ) ap
    ON ap.group_id = g.group_id
  LEFT JOIN (
    SELECT gp.group_id, COALESCE(SUM(gp.points), 0) AS lifetime_base_points
    FROM group_points gp
    GROUP BY gp.group_id
  ) lp
    ON lp.group_id = g.group_id
  LEFT JOIN (
    SELECT group_id, COALESCE(total_points, 0) AS eligibility_bonus_points
    FROM group_eligibility_point_totals
  ) geb
    ON geb.group_id = g.group_id
  LEFT JOIN (
    SELECT
      captain_memberships.group_id,
      s.name AS leader_name,
      s.student_id AS leader_roll_number,
      COALESCE(bph.total_base_points, bp.total_base_points, 0) AS captain_points
    FROM (
      SELECT group_id, MIN(membership_id) AS membership_id
      FROM memberships
      WHERE status = 'ACTIVE'
        AND role = 'CAPTAIN'
      GROUP BY group_id
    ) captain_memberships
    INNER JOIN memberships m
      ON m.membership_id = captain_memberships.membership_id
    INNER JOIN students s
      ON s.student_id = m.student_id
    LEFT JOIN base_points bp
      ON bp.student_id = s.student_id
    LEFT JOIN (
      SELECT
        student_id,
        COALESCE(SUM(points), 0) AS total_base_points
      FROM base_point_history
      GROUP BY student_id
    ) bph
      ON bph.student_id = s.student_id
  ) captain
    ON captain.group_id = g.group_id
`;

exports.createGroup = async (group) => {
  const sql = `
    INSERT INTO Sgroup (group_code, group_name, tier, status)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    group.group_code,
    group.group_name,
    group.tier,
    group.status
  ]);
  return result;
};

exports.getAllGroups = async () => {
  const [rows] = await db.query(
    `${GROUP_OVERVIEW_SELECT}
     ORDER BY g.group_id ASC`
  );
  return rows;
};

exports.getGroupById = async (id) => {
  const [rows] = await db.query(
    `${GROUP_OVERVIEW_SELECT}
     WHERE g.group_id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

exports.updateGroup = async (id, group) => {
  const sql = `
    UPDATE Sgroup
    SET group_name=?, tier=?, status=?
    WHERE group_id=?
  `;
  const [result] = await db.query(sql, [
    group.group_name,
    group.tier,
    group.status,
    id
  ]);
  return result;
};

exports.deleteGroup = async (id) => {
  const [result] = await db.query(
    "UPDATE Sgroup SET status='INACTIVE' WHERE group_id=?",
    [id]
  );
  return result;
};

exports.activateGroup = async (id) => {
  const [result] = await db.query(
    "UPDATE Sgroup SET status='ACTIVE' WHERE group_id=?",
    [id]
  );
  return result;
};

exports.freezeGroup = async (id) => {
  const [result] = await db.query(
    "UPDATE Sgroup SET status='FROZEN' WHERE group_id=?",
    [id]
  );
  return result;
};

exports.getGroupActivationSnapshot = async (groupId) => {
  const [rows] = await db.query(
    `SELECT
       g.group_id,
       g.status AS group_status,
       COUNT(CASE WHEN m.status='ACTIVE' THEN 1 END) AS active_member_count,
       SUM(CASE WHEN m.status='ACTIVE' AND m.role='CAPTAIN' THEN 1 ELSE 0 END) AS captain_count,
       SUM(CASE WHEN m.status='ACTIVE' AND m.role='VICE_CAPTAIN' THEN 1 ELSE 0 END) AS vice_captain_count,
       SUM(CASE WHEN m.status='ACTIVE' AND m.role='STRATEGIST' THEN 1 ELSE 0 END) AS strategist_count,
       SUM(CASE WHEN m.status='ACTIVE' AND m.role='MANAGER' THEN 1 ELSE 0 END) AS manager_count
     FROM Sgroup g
     LEFT JOIN memberships m
       ON m.group_id = g.group_id
     WHERE g.group_id = ?
     GROUP BY g.group_id, g.status`,
    [groupId]
  );
  return rows[0] || null;
};
