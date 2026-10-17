import { createTheme } from "@mui/material/styles";

export type ColorMode = "light" | "dark";

export function createAppTheme(mode: ColorMode) {
  const dark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? "#00A884" : "#008069", contrastText: "#FFFFFF" },
      success: { main: dark ? "#25D366" : "#128C7E" },
      background: {
        default: dark ? "#0B141A" : "#F0F2F5",
        paper: dark ? "#111B21" : "#FFFFFF",
      },
      text: {
        primary: dark ? "#E9EDEF" : "#111B21",
        secondary: dark ? "#8696A0" : "#667781",
      },
      divider: dark ? "#222D34" : "#E9EDEF",
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      fontSize: 14,
      body1: { fontSize: "14.2px", lineHeight: 1.35 },
      body2: { fontSize: "12.5px", lineHeight: 1.35 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { height: "100%", overflow: "hidden" },
          body: {
            height: "100%",
            margin: 0,
            overflow: "hidden",
            colorScheme: mode,
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
          "#root": { minHeight: "100%", height: "100%" },
          "button:focus-visible, [role='button']:focus-visible, input:focus-visible, textarea:focus-visible": {
            outline: `2px solid ${dark ? "#53BDEB" : "#008069"}`,
            outlineOffset: 2,
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              scrollBehavior: "auto !important",
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
            },
          },
        },
      },
    },
  });
}

export const appTheme = createAppTheme("light");
