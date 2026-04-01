import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL, api, clearClientCache } from "../lib/api";
import { connectRealtime, disconnectRealtime } from "../lib/realtime";

const AuthContext = createContext(null);

const AUTH_SESSION_MESSAGES = new Set(["Not authenticated", "Invalid or expired token"]);

const normalizeUser = (authUser) => {
  if (!authUser?.userId || !authUser?.role) {
    return null;
  }

  return {
    userId: authUser.userId,
    role: authUser.role,
    name: authUser.name ?? "",
    sessionExpiresAt: authUser.sessionExpiresAt ?? null
  };
};

const getSessionTimeoutMs = (sessionExpiresAt) => {
  if (!sessionExpiresAt) {
    return null;
  }

  const expiresAtMs = Date.parse(sessionExpiresAt);

  if (Number.isNaN(expiresAtMs)) {
    return null;
  }

  return expiresAtMs - Date.now();
};

const isSessionExpiryError = (error) => {
  const message = error?.response?.data?.message;
  return AUTH_SESSION_MESSAGES.has(message);
};

const clearLogoutTimer = (logoutTimerRef) => {
  if (logoutTimerRef.current !== null) {
    window.clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = null;
  }
};

const clearUserSession = (logoutTimerRef, setUserState) => {
  clearLogoutTimer(logoutTimerRef);
  clearClientCache();
  setUserState(null);
};

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUserState] = useState(null); // { userId, role, name, ... }
  const logoutTimerRef = useRef(null);
  const sessionExpiresAtRef = useRef(null);

  useEffect(() => {
    sessionExpiresAtRef.current = user?.sessionExpiresAt ?? null;
  }, [user?.sessionExpiresAt]);

  const setUser = (nextUser) => {
    setUserState(normalizeUser(nextUser));
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        withCredentials: true,
      });
      const nextUser = normalizeUser(res.data);
      setUserState(nextUser);
      return nextUser;
    } catch (e) {
      setUserState(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    clearLogoutTimer(logoutTimerRef);

    const timeoutMs = getSessionTimeoutMs(user?.sessionExpiresAt);

    if (timeoutMs === null) {
      return undefined;
    }

    if (timeoutMs <= 0) {
      clearUserSession(logoutTimerRef, setUserState);
      return undefined;
    }

    logoutTimerRef.current = window.setTimeout(() => {
      clearUserSession(logoutTimerRef, setUserState);
    }, timeoutMs);

    return () => {
      clearLogoutTimer(logoutTimerRef);
    };
  }, [user?.sessionExpiresAt]);

  useEffect(() => {
    const handleResponseError = (error) => {
      if (isSessionExpiryError(error)) {
        clearUserSession(logoutTimerRef, setUserState);
      }

      return Promise.reject(error);
    };

    const axiosInterceptorId = axios.interceptors.response.use(
      (response) => response,
      handleResponseError
    );
    const apiInterceptorId = api.interceptors.response.use(
      (response) => response,
      handleResponseError
    );

    return () => {
      axios.interceptors.response.eject(axiosInterceptorId);
      api.interceptors.response.eject(apiInterceptorId);
    };
  }, []);

  useEffect(() => {
    const handleSessionCheck = () => {
      const timeoutMs = getSessionTimeoutMs(sessionExpiresAtRef.current);

      if (timeoutMs !== null && timeoutMs <= 0) {
        clearUserSession(logoutTimerRef, setUserState);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleSessionCheck();
      }
    };

    window.addEventListener("focus", handleSessionCheck);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleSessionCheck);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (user?.userId) {
      connectRealtime();
      return undefined;
    }

    disconnectRealtime();
    return undefined;
  }, [user?.userId]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,       // call after login
        refreshUser,   // call when you want to re-check
        logout: async () => {
          try {
            await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
          } catch {}
          clearUserSession(logoutTimerRef, setUserState);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
