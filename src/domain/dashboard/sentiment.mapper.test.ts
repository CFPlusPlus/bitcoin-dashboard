import { describe, expect, it } from "vitest";
import { mapSentimentDto } from "./sentiment.mapper";

describe("mapSentimentDto", () => {
  it("derives a 7-day average and 7-day delta from the fear and greed history", () => {
    const dto = mapSentimentDto({
      payload: {
        name: "Fear and Greed Index",
        data: [
          {
            value: "62",
            value_classification: "Greed",
            timestamp: "1710000000",
            time_until_update: "3600",
          },
          { value: "58", timestamp: "1709913600" },
          { value: "54", timestamp: "1709827200" },
          { value: "50", timestamp: "1709740800" },
          { value: "46", timestamp: "1709654400" },
          { value: "44", timestamp: "1709568000" },
          { value: "40", timestamp: "1709481600" },
        ],
        metadata: { error: null },
      },
      now: 1710000000000,
      fetchedAt: "2026-03-19T12:00:00.000Z",
    });

    expect(dto.value).toBe(62);
    expect(dto.average7d).toBe(50.57);
    expect(dto.change7d).toBe(22);
  });
});
