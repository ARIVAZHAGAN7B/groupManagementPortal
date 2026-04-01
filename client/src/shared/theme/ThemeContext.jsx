import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = "gmp-theme-mode";
const DEFAULT_THEME_MODE = "system";
const THEME_COLOR_BY_RESOLVED_THEME = {
  light: "#f8fafc",
  dark: "#020617",
};

const isValidThemeMode = (value) => ["light", "dark", "system"].includes(value);

const normalizeThemeMode = (value) =>
  isValidThemeMode(value) ? value : DEFAULT_THEME_MODE;

const getSystemTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getStoredThemeMode = () => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_MODE;
  }

  try {
    return normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_MODE;
  }
};

const applyThemeToDocument = (themeMode, resolvedTheme) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.themeMode = themeMode;
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute(
      "content",
      THEME_COLOR_BY_RESOLVED_THEME[resolvedTheme] || THEME_COLOR_BY_RESOLVED_THEME.light
    );
  }
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState(getStoredThemeMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const resolvedTheme = themeMode === "system" ? systemTheme : themeMode;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncSystemTheme);
      return () => mediaQuery.removeEventListener("change", syncSystemTheme);
    }

    mediaQuery.addListener(syncSystemTheme);
    return () => mediaQuery.removeListener(syncSystemTheme);
  }, []);

  useEffect(() => {
    applyThemeToDocument(themeMode, resolvedTheme);

    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {}
  }, [resolvedTheme, themeMode]);

  const setThemeMode = (nextThemeMode) => {
    setThemeModeState(normalizeThemeMode(nextThemeMode));
  };

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode,
    }),
    [resolvedTheme, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};
