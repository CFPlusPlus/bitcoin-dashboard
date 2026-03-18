import { describe, expect, it } from "vitest";
import { mapPerformanceDto } from "./performance.mapper";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("mapPerformanceDto", () => {
  it("calculates performance across the configured windows", () => {
    const now = Date.UTC(2026, 2, 18, 0, 0, 0, 0);

    const dto = mapPerformanceDto({
      currency: "usd",
      fetchedAt: new Date(now).toISOString(),
      payload: {
        prices: [
          [Date.UTC(2025, 0, 1, 0, 0, 0, 0), 80000],
          [Date.UTC(2026, 0, 1, 0, 0, 0, 0), 80000],
          [Date.UTC(2025, 2, 18, 0, 0, 0, 0), 60000],
          [now - 30 * DAY_MS, 90000],
          [now - 7 * DAY_MS, 95000],
          [now, 100000],
        ],
      },
    });

    expect(dto.currentPrice).toBe(100000);
    expect(dto.periods).toEqual([
      expect.objectContaining({ key: "7d", changePercent: 5.26 }),
      expect.objectContaining({ key: "30d", changePercent: 11.11 }),
      expect.objectContaining({ key: "1y", changePercent: 66.67 }),
      expect.objectContaining({ key: "ytd", changePercent: 25 }),
    ]);
  });

  it("returns null performance for windows without a usable reference point", () => {
    const now = Date.UTC(2026, 2, 18, 0, 0, 0, 0);

    const dto = mapPerformanceDto({
      currency: "eur",
      fetchedAt: new Date(now).toISOString(),
      payload: {
        prices: [
          [now - DAY_MS, 82000],
          [now, 84000],
        ],
      },
    });

    expect(dto.periods.every((period) => period.changePercent === null)).toBe(true);
  });
});
