import { describe, expect, it } from "vitest";
import {
  formatChartAxisLabel,
  formatChartCoverageLabel,
  formatChartShortDateLabel,
  formatChartTooltipLabel,
} from "./chart-format";

describe("chart format helpers", () => {
  const morningTimestamp = new Date(2025, 2, 31, 7, 5, 0).getTime();

  it("formats 1-day axis labels with hours and minutes", () => {
    expect(formatChartAxisLabel(morningTimestamp, 1, "de")).toBe("07:05");
    expect(formatChartAxisLabel(morningTimestamp, 1, "en")).toBe("07:05 AM");
  });

  it("formats multi-day chart labels with calendar dates", () => {
    expect(formatChartAxisLabel(morningTimestamp, 30, "de")).toBe("31.03.");
    expect(formatChartAxisLabel(morningTimestamp, 30, "en")).toBe("03/31");
  });

  it("formats coverage and tooltip labels with the expected detail level", () => {
    expect(formatChartCoverageLabel(morningTimestamp, 1, "de")).toContain("31.03.");
    expect(formatChartTooltipLabel(morningTimestamp, 1, "en")).toContain("03/31/2025");
    expect(formatChartCoverageLabel(morningTimestamp, 30, "de")).toBe("31.03.2025");
    expect(formatChartTooltipLabel(morningTimestamp, 30, "en")).toBe("03/31/2025");
  });

  it("formats compact market metric dates", () => {
    expect(formatChartShortDateLabel(morningTimestamp, "de")).toBe("31.03.25");
    expect(formatChartShortDateLabel(morningTimestamp, "en")).toBe("03/31/25");
  });
});
