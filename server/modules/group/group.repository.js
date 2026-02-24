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
  const [rows] = await db.query("SELECT * FROM Sgroup");
  return rows;
};

exports.getGroupById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM Sgroup WHERE group_id = ?",
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