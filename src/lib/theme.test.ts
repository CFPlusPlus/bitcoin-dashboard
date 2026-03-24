import { describe, expect, it } from "vitest";
import { isThemeMode, resolveThemeMode } from "./theme";

describe("theme helpers", () => {
  it("recognizes supported theme modes", () => {
    expect(isThemeMode("light")).toBe(true);
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("system")).toBe(false);
    expect(isThemeMode(null)).toBe(false);
  });

  it("prefers an explicit stored theme when available", () => {
    expect(resolveThemeMode("light", true)).toBe("light");
    expect(resolveThemeMode("dark", false)).toBe("dark");
  });

  it("falls back to the system preference for invalid values", () => {
    expect(resolveThemeMode("system", true)).toBe("dark");
    expect(resolveThemeMode(undefined, false)).toBe("light");
  });
});
