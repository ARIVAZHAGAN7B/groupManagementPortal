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
      ) AS active_member_count
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
       ) AS active_member_count
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
