import { describe, expect, it } from "vitest";
import { mapNetworkDto } from "./network.mapper";

describe("mapNetworkDto", () => {
  it("derives next halving progress and estimate from the latest block height", () => {
    const dto = mapNetworkDto({
      fees: null,
      latestBlockHeight: 839_000,
      hashrate: null,
      difficultyAdjustment: {
        progressPercent: 80,
        difficultyChange: 2.3,
        estimatedRetargetDate: Date.parse("2026-03-26T00:00:00.000Z"),
        remainingBlocks: 400,
        nextRetargetHeight: 839_400,
      },
      mempoolBlocks: null,
      recentBlocks: null,
      fetchedAt: "2026-03-23T12:00:00.000Z",
    });

    expect(dto.halving).toEqual({
      progressPercent: (209_000 / 210_000) * 100,
      estimatedDaysUntil: 6,
      remainingBlocks: 1_000,
      nextHalvingHeight: 840_000,
      estimatedDate: "2026-03-29T18:00:00.000Z",
      currentReward: 6.25,
      nextReward: 3.125,
    });
  });

  it("keeps the estimate empty when no upstream pace data is available", () => {
    const dto = mapNetworkDto({
      fees: null,
      latestBlockHeight: 840_000,
      hashrate: null,
      difficultyAdjustment: null,
      mempoolBlocks: null,
      recentBlocks: null,
      fetchedAt: "2026-03-23T12:00:00.000Z",
    });

    expect(dto.halving.progressPercent).toBe(0);
    expect(dto.halving.remainingBlocks).toBe(210_000);
    expect(dto.halving.nextHalvingHeight).toBe(1_050_000);
    expect(dto.halving.estimatedDaysUntil).toBeNull();
    expect(dto.halving.estimatedDate).toBeNull();
    expect(dto.halving.currentReward).toBe(3.125);
    expect(dto.halving.nextReward).toBe(1.5625);
  });
});
