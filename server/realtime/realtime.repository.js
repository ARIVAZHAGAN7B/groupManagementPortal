const db = require("../config/db");
const SNAPSHOT_CACHE_TTL_MS = 15 * 1000;
const snapshotCache = new Map();
const inFlightSnapshots = new Map();

const clearSocketSnapshotCache = (userId) => {
  if (userId) {
    snapshotCache.delete(String(userId));
    inFlightSnapshots.delete(String(userId));
  } else {
    snapshotCache.clear();
    inFlightSnapshots.clear();
  }
};


const getStudentByUserId = async (userId, executor = db) => {
  const [rows] = await executor.query(
    `SELECT student_id
     FROM students
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

const getAdminByUserId = async (userId, executor = db) => {
  const [rows] = await executor.query(
    `SELECT admin_id
     FROM admins
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

const getActiveGroupIdsByStudentId = async (studentId, executor = db) => {
  if (!studentId) return [];

  const [rows] = await executor.query(
    `SELECT DISTINCT group_id
     FROM memberships
     WHERE student_id = ?
       AND status = 'ACTIVE'
       AND group_id IS NOT NULL`,
    [studentId]
  );

  return (rows || [])
    .map((row) => Number(row?.group_id))
    .filter((groupId) => Number.isInteger(groupId) && groupId > 0);
};

const getActiveTeamIdsByStudentId = async (studentId, executor = db) => {
  if (!studentId) return [];

  const [rows] = await executor.query(
    `SELECT DISTINCT team_id
     FROM team_membership
     WHERE student_id = ?
       AND status = 'ACTIVE'
       AND team_id IS NOT NULL`,
    [studentId]
  );

  return (rows || [])
    .map((row) => Number(row?.team_id))
    .filter((teamId) => Number.isInteger(teamId) && teamId > 0);
};

const getSocketAccessSnapshot = async (userId, executor = db, skipCache = false) => {
  if (!userId) {
    return {
      userId: null,
      studentId: null,
      adminId: null,
      groupIds: [],
      teamIds: []
    };
  }

  const userKey = String(userId);

  if (!skipCache && executor === db) {
    const cached = snapshotCache.get(userKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.snapshot;
    }

    if (inFlightSnapshots.has(userKey)) {
      return inFlightSnapshots.get(userKey);
    }
  }

  const fetchPromise = (async () => {
    try {
      const [student, admin] = await Promise.all([
        getStudentByUserId(userId, executor),
        getAdminByUserId(userId, executor)
      ]);

      const studentId = student?.student_id || null;
      const [groupIds, teamIds] = await Promise.all([
        getActiveGroupIdsByStudentId(studentId, executor),
        getActiveTeamIdsByStudentId(studentId, executor)
      ]);

      const snapshot = {
        userId: userKey,
        studentId: studentId ? String(studentId) : null,
        adminId: admin?.admin_id ? String(admin.admin_id) : null,
        groupIds,
        teamIds
      };

      if (executor === db) {
        snapshotCache.set(userKey, {
          snapshot,
          expiresAt: Date.now() + SNAPSHOT_CACHE_TTL_MS
        });
      }

      return snapshot;
    } finally {
      if (executor === db) {
        inFlightSnapshots.delete(userKey);
      }
    }
  })();

  if (!skipCache && executor === db) {
    inFlightSnapshots.set(userKey, fetchPromise);
  }

  return fetchPromise;
};

module.exports = {
  getSocketAccessSnapshot,
  clearSocketSnapshotCache
};
