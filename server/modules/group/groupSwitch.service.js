const db = require("../../config/db");
const phaseRepo = require("../phase/phase.repository");
const systemConfigService = require("../systemConfig/systemConfig.service");

const toDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
};

const resolveGroupStatusByCount = (count, policy) => {
  const min = Number(policy.min_group_members) || 9;
  const max = Number(policy.max_group_members) || 11;
  return count >= min && count <= max ? "ACTIVE" : "INACTIVE";
};

exports.switchGroup = async (studentId, newGroupId) => {
  if (!studentId) throw new Error("studentId is required");
  if (!newGroupId) throw new Error("newGroupId is required");

  const [phase, policy] = await Promise.all([
    phaseRepo.getCurrentPhase(),
    systemConfigService.getOperationalPolicy()
  ]);

  if (!phase) {
    throw new Error("No active phase found");
  }

  const today = toDateOnly(new Date());
  const changeDay = toDateOnly(phase.change_day);

  if (!today || !changeDay || today !== changeDay) {
    throw new Error("Group switching is allowed only on Change Day");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [currentRows] = await conn.query(
      `SELECT membership_id, group_id, role
       FROM memberships
       WHERE student_id=? AND status='ACTIVE'
       LIMIT 1
       FOR UPDATE`,
      [studentId]
    );
    const currentMembership = currentRows[0];

    if (!currentMembership) {
      throw new Error("Active membership not found");
    }

    if (Number(currentMembership.group_id) === Number(newGroupId)) {
      throw new Error("Student is already in this group");
    }

    const [targetGroupRows] = await conn.query(
      `SELECT group_id, status
       FROM Sgroup
       WHERE group_id=?
       LIMIT 1
       FOR UPDATE`,
      [newGroupId]
    );
    const targetGroup = targetGroupRows[0];
    if (!targetGroup) {
      throw new Error("Target group not found");
    }
    if (String(targetGroup.status || "").toUpperCase() === "FROZEN") {
      throw new Error("Cannot switch into a frozen group");
    }

    const [[targetCountRow]] = await conn.query(
      `SELECT COUNT(*) AS count
       FROM memberships
       WHERE group_id=? AND status='ACTIVE'
       FOR UPDATE`,
      [newGroupId]
    );
    const targetCountBefore = Number(targetCountRow?.count) || 0;
    if (targetCountBefore >= Number(policy.max_group_members)) {
      throw new Error("Target group is full");
    }

    await conn.query(
      `UPDATE memberships
       SET status='LEFT', leave_date=NOW()
       WHERE membership_id=?`,
      [currentMembership.membership_id]
    );

    let incubationEndDate = null;
    if (Number(policy.incubation_duration_days) > 0) {
      const d = new Date();
      d.setDate(d.getDate() + Number(policy.incubation_duration_days));
      incubationEndDate = d.toISOString().slice(0, 19).replace("T", " ");
    }

    const [insertResult] = await conn.query(
      `INSERT INTO memberships
         (student_id, group_id, role, status, join_date, incubation_end_date)
       VALUES (?, ?, 'MEMBER', 'ACTIVE', NOW(), ?)`,
      [studentId, newGroupId, incubationEndDate]
    );

    const [[oldCountRow]] = await conn.query(
      `SELECT COUNT(*) AS count
       FROM memberships
       WHERE group_id=? AND status='ACTIVE'`,
      [currentMembership.group_id]
    );
    const [[newCountRow]] = await conn.query(
      `SELECT COUNT(*) AS count
       FROM memberships
       WHERE group_id=? AND status='ACTIVE'`,
      [newGroupId]
    );

    const oldCount = Number(oldCountRow?.count) || 0;
    const newCount = Number(newCountRow?.count) || 0;

    await conn.query(`UPDATE Sgroup SET status=? WHERE group_id=?`, [
      resolveGroupStatusByCount(oldCount, policy),
      currentMembership.group_id
    ]);
    await conn.query(`UPDATE Sgroup SET status=? WHERE group_id=?`, [
      resolveGroupStatusByCount(newCount, policy),
      newGroupId
    ]);

    await conn.commit();

    return {
      message: "Group switched successfully",
      membership_id: insertResult.insertId,
      student_id: Number(studentId),
      old_group_id: Number(currentMembership.group_id),
      new_group_id: Number(newGroupId),
      incubation_end_date: incubationEndDate,
      change_day: changeDay
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};
