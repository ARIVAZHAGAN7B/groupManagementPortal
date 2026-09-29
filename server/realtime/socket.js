const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const { isSessionExpired } = require("../utils/jwt");
const realtimeRepo = require("./realtime.repository");
const { createCorsOriginResolver } = require("../config/runtime");

const AUTHENTICATED_ROOM = "authenticated";
const ADMINS_ROOM = "admins";
const ROOM_PREFIXES = {
  user: "user:",
  role: "role:",
  student: "student:",
  group: "group:",
  team: "team:"
};

let io = null;

const buildRoom = (prefix, value) => `${prefix}${String(value)}`;
const getUserRoom = (userId) => buildRoom(ROOM_PREFIXES.user, userId);
const getRoleRoom = (role) => buildRoom(ROOM_PREFIXES.role, String(role || "").toUpperCase());
const getStudentRoom = (studentId) => buildRoom(ROOM_PREFIXES.student, studentId);
const getGroupRoom = (groupId) => buildRoom(ROOM_PREFIXES.group, groupId);
const getTeamRoom = (teamId) => buildRoom(ROOM_PREFIXES.team, teamId);

const isManagedRoom = (roomName) =>
  roomName === AUTHENTICATED_ROOM ||
  roomName === ADMINS_ROOM ||
  Object.values(ROOM_PREFIXES).some((prefix) => String(roomName || "").startsWith(prefix));

const getAuthTokenFromSocket = (socket) => {
  const rawCookieHeader = socket?.handshake?.headers?.cookie || "";
  const parsedCookies = cookie.parse(rawCookieHeader);
  return parsedCookies?.token || null;
};

const authenticateSocket = (socket, next) => {
  try {
    const token = getAuthTokenFromSocket(socket);
    if (!token) {
      return next(new Error("Not authenticated"));
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    if (isSessionExpired(decoded)) {
      return next(new Error("Invalid or expired token"));
    }

    socket.data.user = decoded;
    return next();
  } catch (_error) {
    return next(new Error("Invalid or expired token"));
  }
};

const buildDesiredRooms = async (socket) => {
  const userId = socket?.data?.user?.userId;
  const role = socket?.data?.user?.role;
  const snapshot = await realtimeRepo.getSocketAccessSnapshot(userId);

  const desiredRooms = new Set([
    AUTHENTICATED_ROOM,
    getUserRoom(userId),
    getRoleRoom(role)
  ]);

  if (snapshot.studentId) {
    desiredRooms.add(getStudentRoom(snapshot.studentId));
  }

  if (snapshot.adminId || ["ADMIN", "SYSTEM_ADMIN"].includes(String(role || "").toUpperCase())) {
    desiredRooms.add(ADMINS_ROOM);
  }

  snapshot.groupIds.forEach((groupId) => {
    desiredRooms.add(getGroupRoom(groupId));
  });

  snapshot.teamIds.forEach((teamId) => {
    desiredRooms.add(getTeamRoom(teamId));
  });

  return {
    snapshot,
    desiredRooms
  };
};

const syncSocketRooms = async (socket) => {
  if (!socket?.data?.user?.userId) {
    return {
      studentId: null,
      adminId: null,
      groupIds: [],
      teamIds: []
    };
  }

  const { snapshot, desiredRooms } = await buildDesiredRooms(socket);

  for (const roomName of Array.from(socket.rooms || [])) {
    if (roomName === socket.id) continue;
    if (!isManagedRoom(roomName)) continue;
    if (!desiredRooms.has(roomName)) {
      await socket.leave(roomName);
    }
  }

  for (const roomName of desiredRooms) {
    if (!socket.rooms.has(roomName)) {
      await socket.join(roomName);
    }
  }

  return snapshot;
};

const syncSocketsInRoom = async (roomName) => {
  if (!io || !roomName) return;

  const socketIds = Array.from(io.sockets.adapter.rooms.get(roomName) || []);
  await Promise.all(
    socketIds.map(async (socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket) return;
      await syncSocketRooms(socket);
    })
  );
};

const syncStudentRooms = async (studentId) => {
  if (!studentId) return;
  realtimeRepo.clearSocketSnapshotCache();
  await syncSocketsInRoom(getStudentRoom(studentId));
};

const emitToRoom = (roomName, eventName, payload = {}) => {
  if (!io || !roomName || !eventName) return;
  io.to(roomName).emit(eventName, payload);
};

const emitToRooms = (roomNames = [], eventName, payload = {}) => {
  const uniqueRooms = Array.from(new Set((roomNames || []).filter(Boolean)));
  uniqueRooms.forEach((roomName) => {
    emitToRoom(roomName, eventName, payload);
  });
};

const emitToAuthenticated = (eventName, payload = {}) => {
  emitToRoom(AUTHENTICATED_ROOM, eventName, payload);
};

const emitToAdmins = (eventName, payload = {}) => {
  emitToRoom(ADMINS_ROOM, eventName, payload);
};

const emitToStudent = (studentId, eventName, payload = {}) => {
  if (!studentId) return;
  emitToRoom(getStudentRoom(studentId), eventName, payload);
};

const emitToGroup = (groupId, eventName, payload = {}) => {
  if (!groupId) return;
  emitToRoom(getGroupRoom(groupId), eventName, payload);
};

const emitToTeam = (teamId, eventName, payload = {}) => {
  if (!teamId) return;
  emitToRoom(getTeamRoom(teamId), eventName, payload);
};

const getRealtimeSummary = () => {
  const authenticatedConnections = Number(
    io?.sockets?.adapter?.rooms?.get(AUTHENTICATED_ROOM)?.size
  ) || 0;
  const adminConnections = Number(io?.sockets?.adapter?.rooms?.get(ADMINS_ROOM)?.size) || 0;

  return {
    authenticated_connections: authenticatedConnections,
    admin_connections: adminConnections
  };
};

const initializeRealtime = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: createCorsOriginResolver(),
      credentials: true
    }
  });

  // Multi-node horizontal scaling hook: use Redis adapter if REDIS_URL is provided
  if (process.env.REDIS_URL) {
    try {
      const { createAdapter } = require("@socket.io/redis-adapter");
      const { createClient } = require("redis");
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          io.adapter(createAdapter(pubClient, subClient));
          console.log("[realtime] Redis adapter initialized for multi-node clustering");
        })
        .catch((err) => {
          console.error("[realtime] Failed to connect to Redis adapter:", err.message);
        });
    } catch (_err) {
      console.warn(
        "[realtime] REDIS_URL configured, but @socket.io/redis-adapter is not installed. Using in-memory adapter."
      );
    }
  }

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    void syncSocketRooms(socket).catch((error) => {
      console.error("[realtime-sync-failed]", error?.message || error);
    });

    socket.on("realtime:sync", async (ack) => {
      try {
        const snapshot = await syncSocketRooms(socket);
        if (typeof ack === "function") {
          ack({ ok: true, snapshot });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, error: error?.message || "Failed to sync realtime rooms" });
        }
      }
    });
  });

  return io;
};

module.exports = {
  AUTHENTICATED_ROOM,
  ADMINS_ROOM,
  ROOM_PREFIXES,
  getUserRoom,
  getRoleRoom,
  getStudentRoom,
  getGroupRoom,
  getTeamRoom,
  initializeRealtime,
  getRealtimeSummary,
  emitToAuthenticated,
  emitToAdmins,
  emitToStudent,
  emitToGroup,
  emitToTeam,
  emitToRoom,
  emitToRooms,
  syncStudentRooms
};
