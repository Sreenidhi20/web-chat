import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createAppTheme, type ColorMode } from "../theme.ts";
import { ColorModeContext } from "./colorMode.ts";

const STORAGE_KEY = "web-chat-color-mode";

function getInitialMode(): ColorMode {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const storedMode = window.localStorage.getItem(STORAGE_KEY);
    if (storedMode === "light" || storedMode === "dark") {
      return storedMode;
    }
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }

  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(getInitialMode);
  const toggleMode = useCallback(() => {
    setMode((currentMode) => {
      const nextMode = currentMode === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem(STORAGE_KEY, nextMode);
      } catch {
        // Keep the in-memory preference if storage is unavailable.
      }
      return nextMode;
    });
  }, []);
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
