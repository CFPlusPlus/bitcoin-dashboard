import { describe, expect, it } from "vitest";
import { clampSentimentValue, getSentimentNeedleAngle, getSentimentZoneKey } from "./sentiment";

describe("sentiment helpers", () => {
  it("clamps sentiment values into the index range", () => {
    expect(clampSentimentValue(-8)).toBe(0);
    expect(clampSentimentValue(42)).toBe(42);
    expect(clampSentimentValue(118)).toBe(100);
    expect(clampSentimentValue(null)).toBeNull();
  });

  it.each([
    [0, "extremeFear"],
    [24, "extremeFear"],
    [25, "fear"],
    [44, "fear"],
    [45, "neutral"],
    [54, "neutral"],
    [55, "greed"],
    [74, "greed"],
    [75, "extremeGreed"],
    [100, "extremeGreed"],
  ])("maps %s to the %s zone", (value, expectedZone) => {
    expect(getSentimentZoneKey(value, null)).toBe(expectedZone);
  });

  it("falls back to the provider classification when no numeric value is available", () => {
    expect(getSentimentZoneKey(null, "Extreme Fear")).toBe("extremeFear");
    expect(getSentimentZoneKey(null, "Greed")).toBe("greed");
    expect(getSentimentZoneKey(null, "Neutral")).toBe("neutral");
    expect(getSentimentZoneKey(null, "Extreme Greed")).toBe("extremeGreed");
  });

  it("returns a centered needle angle when the value is missing", () => {
    expect(getSentimentNeedleAngle(null)).toBe(270);
  });

  it("maps the score range to the left and right ends of the gauge", () => {
    expect(getSentimentNeedleAngle(0)).toBe(180);
    expect(getSentimentNeedleAngle(50)).toBe(270);
    expect(getSentimentNeedleAngle(100)).toBe(360);
  });
});
