"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

import type { ReactNode } from "react";

type Mode = "auto" | "dark" | "light";
interface ThemeState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  currentTheme: "dark" | "light";
}
const ThemeContext = createContext<ThemeState | null>(null);
const subscribeMode = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener("theme-mode-change", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("theme-mode-change", notify);
  };
};
function storedMode(): Mode {
  try {
    const value = localStorage.getItem("theme-mode");
    return value === "dark" || value === "light" ? value : "auto";
  } catch {
    return "auto";
  }
}
const serverMode = (): Mode => "auto";
const subscribeSystem = (notify: () => void) => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const systemDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;
const serverDark = () => false;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribeMode, storedMode, serverMode);
  const dark = useSyncExternalStore(subscribeSystem, systemDark, serverDark);
  const currentTheme = mode === "auto" ? (dark ? "dark" : "light") : mode;
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setMode = useCallback((value: Mode) => {
    try {
      localStorage.setItem("theme-mode", value);
    } catch {
      return;
    }
    window.dispatchEvent(new Event("theme-mode-change"));
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.theme && root.dataset.theme !== currentTheme) {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      root.classList.add("theme-transition");
      transitionTimer.current = setTimeout(
        () => root.classList.remove("theme-transition"),
        500,
      );
    }
    root.dataset.theme = currentTheme;
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      root.classList.remove("theme-transition");
    };
  }, [currentTheme]);
  return (
    <ThemeContext.Provider value={{ mode, setMode, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("ThemeProvider отсутствует");
  return value;
}
