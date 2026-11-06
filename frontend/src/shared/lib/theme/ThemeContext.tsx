import { createContext, useContext, useEffect, useRef, useState } from "react";

import type { ReactNode } from "react";

type Mode = "auto" | "dark" | "light";

interface ThemeState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  currentTheme: "dark" | "light";
}

const ThemeContext = createContext<ThemeState | null>(null);

function storedMode(): Mode {
  const value = localStorage.getItem("theme-mode");

  return value === "dark" || value === "light" ? value : "auto";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(storedMode);
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">(() => {
    const value = storedMode();

    return value === "auto"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : value;
  });

  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const theme = mode === "auto" ? (media.matches ? "dark" : "light") : mode;
      const root = document.documentElement;
      if (root.dataset.theme && root.dataset.theme !== theme) {
        if (transitionTimer.current) clearTimeout(transitionTimer.current);

        root.classList.add("theme-transition");
        transitionTimer.current = setTimeout(() => {
          root.classList.remove("theme-transition");
        }, 500);
      }

      root.setAttribute("data-theme", theme);
      setCurrentTheme(theme);
    };

    apply();
    media.addEventListener("change", apply);

    return () => {
      media.removeEventListener("change", apply);
      if (transitionTimer.current) clearTimeout(transitionTimer.current);

      document.documentElement.classList.remove("theme-transition");
    };
  }, [mode]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        currentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("ThemeProvider отсутствует");

  return value;
}
