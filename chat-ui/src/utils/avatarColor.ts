import type { ColorMode } from "../theme.ts";

const lightColors = [
  "#D7F2EA",
  "#FCE4EC",
  "#E8E0F7",
  "#FCE8D5",
  "#DCEAF8",
  "#F2E8CF",
  "#DDEEDB",
  "#F4DFD4",
];

const darkColors = [
  "#17443B",
  "#513A44",
  "#40365B",
  "#59432F",
  "#29445B",
  "#554D2B",
  "#31503A",
  "#54392F",
];

export function avatarColor(username: string, mode: ColorMode = "light"): string {
  let hash = 5381;
  for (const character of username.toLowerCase()) {
    hash = Math.imul(hash, 33) ^ character.codePointAt(0)!;
  }

  const palette = mode === "dark" ? darkColors : lightColors;
  return palette[(hash >>> 0) % palette.length];
}
