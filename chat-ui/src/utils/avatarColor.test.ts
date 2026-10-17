import { describe, expect, it } from "vitest";
import { avatarColor } from "./avatarColor.ts";

describe("avatarColor", () => {
  it("returns a stable color for a username regardless of letter case", () => {
    expect(avatarColor("Sreenidhi")).toBe(avatarColor("sreenidhi"));
  });

  it("returns a valid palette color for each theme", () => {
    expect(avatarColor("alice", "light")).toMatch(/^#[\da-f]{6}$/i);
    expect(avatarColor("alice", "dark")).toMatch(/^#[\da-f]{6}$/i);
    expect(avatarColor("alice", "light")).not.toBe(
      avatarColor("alice", "dark"),
    );
  });
});
