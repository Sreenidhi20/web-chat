import { createContext, useContext } from "react";
import type { ColorMode } from "../theme.ts";

export interface ColorModeContextValue {
  mode: ColorMode;
  toggleMode: () => void;
}

export const ColorModeContext =
  createContext<ColorModeContextValue | null>(null);

export function useColorMode(): ColorModeContextValue {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error("useColorMode must be used within a ColorModeProvider.");
  }
  return context;
}
