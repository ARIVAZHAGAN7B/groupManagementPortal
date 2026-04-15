import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

export const REALTIME_EVENTS = {
  ADMIN_NOTIFICATIONS: "realtime:admin-notifications",
  JOIN_REQUESTS: "realtime:join-requests",
  EVENT_JOIN_REQUESTS: "realtime:event-join-requests",
  EVENT_TEAM_INVITATIONS: "realtime:event-team-invitations",
  LEADERSHIP_REQUESTS: "realtime:leadership-requests",
  GROUP_TIER_REQUESTS: "realtime:group-tier-requests",
  MEMBERSHIPS: "realtime:memberships",
  TEAM_MEMBERSHIPS: "realtime:team-memberships",
  PHASE: "realtime:phase",
  POINTS: "realtime:points",
  ELIGIBILITY: "realtime:eligibility",
  AUDIT: "realtime:audit"
};

let socketInstance = null;

const createSocket = () => {
  const socket = io(API_BASE_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"]
  });

  socket.on("connect", () => {
    socket.emit("realtime:sync");
  });

  return socket;
};

export const getRealtimeSocket = () => {
  if (!socketInstance) {
    socketInstance = createSocket();
  }

  return socketInstance;
};

export const connectRealtime = () => {
  const socket = getRealtimeSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectRealtime = () => {
  if (socketInstance) {
    socketInstance.disconnect();
  }
};

export const subscribeRealtime = (eventName, handler) => {
  const socket = getRealtimeSocket();
  socket.on(eventName, handler);

  return () => {
    socket.off(eventName, handler);
  };
};

export const matchesRealtimeScope = (payload = {}, scopes = {}) =>
  Object.entries(scopes).every(([key, expectedValue]) => {
    if (expectedValue === undefined || expectedValue === null || expectedValue === "") {
      return true;
    }

    const actualValue = payload?.[key];
    if (actualValue === undefined || actualValue === null || actualValue === "") {
      return true;
    }

    return String(actualValue) === String(expectedValue);
  });
