import { describe, expect, it } from "vitest";
import {
  DASHBOARD_SECTION_IDS,
  getDashboardSectionId,
  isDashboardSectionId,
} from "./dashboard-workspace";

describe("dashboard workspace helpers", () => {
  it("accepts the known dashboard section ids", () => {
    for (const sectionId of DASHBOARD_SECTION_IDS) {
      expect(isDashboardSectionId(sectionId)).toBe(true);
      expect(getDashboardSectionId(sectionId)).toBe(sectionId);
    }
  });

  it("falls back to overview for unknown section ids", () => {
    expect(isDashboardSectionId("tools")).toBe(false);
    expect(isDashboardSectionId(null)).toBe(false);
    expect(getDashboardSectionId("tools")).toBe("overview");
    expect(getDashboardSectionId(undefined)).toBe("overview");
  });
});
