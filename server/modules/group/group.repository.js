const db = require("../../config/db");

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
  const [rows] = await db.query(`
    SELECT
      g.*,
      (
        SELECT COUNT(*)
        FROM memberships m
        WHERE m.group_id = g.group_id AND m.status = 'ACTIVE'
      ) AS active_member_count,
      (
        SELECT COALESCE(SUM(gp.points), 0)
        FROM group_points gp
        WHERE gp.group_id = g.group_id
      ) AS total_points,
      (
        SELECT s.name
        FROM memberships m
        INNER JOIN students s ON s.student_id = m.student_id
        WHERE m.group_id = g.group_id
          AND m.status = 'ACTIVE'
          AND m.role = 'CAPTAIN'
        ORDER BY m.membership_id ASC
        LIMIT 1
      ) AS leader_name,
      (
        SELECT s.student_id
        FROM memberships m
        INNER JOIN students s ON s.student_id = m.student_id
        WHERE m.group_id = g.group_id
          AND m.status = 'ACTIVE'
          AND m.role = 'CAPTAIN'
        ORDER BY m.membership_id ASC
        LIMIT 1
      ) AS leader_roll_number,
      (
        SELECT COALESCE(bph.total_base_points, bp.total_base_points, 0)
        FROM memberships m
        INNER JOIN students s ON s.student_id = m.student_id
        LEFT JOIN base_points bp
          ON bp.student_id = s.student_id
        LEFT JOIN (
          SELECT
            h.student_id,
            COALESCE(SUM(h.points), 0) AS total_base_points
          FROM base_point_history h
          GROUP BY h.student_id
        ) bph
          ON bph.student_id = s.student_id
        WHERE m.group_id = g.group_id
          AND m.status = 'ACTIVE'
          AND m.role = 'CAPTAIN'
        ORDER BY m.membership_id ASC
        LIMIT 1
      ) AS captain_points
    FROM Sgroup g
    ORDER BY g.group_id ASC
  `);
  return rows;
};

exports.getGroupById = async (id) => {
  const [rows] = await db.query(
    `SELECT
       g.*,
       (
         SELECT COUNT(*)
         FROM memberships m
         WHERE m.group_id = g.group_id AND m.status = 'ACTIVE'
       ) AS active_member_count,
       (
         SELECT COALESCE(SUM(gp.points), 0)
         FROM group_points gp
         WHERE gp.group_id = g.group_id
       ) AS total_points,
       (
         SELECT s.name
         FROM memberships m
         INNER JOIN students s ON s.student_id = m.student_id
         WHERE m.group_id = g.group_id
           AND m.status = 'ACTIVE'
           AND m.role = 'CAPTAIN'
         ORDER BY m.membership_id ASC
         LIMIT 1
       ) AS leader_name,
       (
         SELECT s.student_id
         FROM memberships m
         INNER JOIN students s ON s.student_id = m.student_id
         WHERE m.group_id = g.group_id
           AND m.status = 'ACTIVE'
           AND m.role = 'CAPTAIN'
         ORDER BY m.membership_id ASC
         LIMIT 1
       ) AS leader_roll_number,
       (
         SELECT COALESCE(bph.total_base_points, bp.total_base_points, 0)
         FROM memberships m
         INNER JOIN students s ON s.student_id = m.student_id
         LEFT JOIN base_points bp
           ON bp.student_id = s.student_id
         LEFT JOIN (
           SELECT
             h.student_id,
             COALESCE(SUM(h.points), 0) AS total_base_points
           FROM base_point_history h
           GROUP BY h.student_id
         ) bph
           ON bph.student_id = s.student_id
         WHERE m.group_id = g.group_id
           AND m.status = 'ACTIVE'
           AND m.role = 'CAPTAIN'
         ORDER BY m.membership_id ASC
         LIMIT 1
       ) AS captain_points
     FROM Sgroup g
     WHERE g.group_id = ?`,
    [id]
  );
  return rows[0];
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
