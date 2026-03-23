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
    expect(dto.activity).toEqual({
      averageBlockTimeMinutes: null,
      averageTransactionsPerBlock: null,
      averageBlockSizeBytes: null,
    });
    expect(dto.feeSpread).toEqual({
      fastestToHour: null,
      hourToMinimum: null,
      fastestToMinimum: null,
    });
    expect(dto.mempool.backlogBlocks).toBeNull();
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

  it("derives block flow, backlog, and fee spreads from the latest mempool data", () => {
    const dto = mapNetworkDto({
      fees: {
        fastestFee: 12,
        halfHourFee: 8,
        hourFee: 5,
        economyFee: 3,
        minimumFee: 2,
      },
      latestBlockHeight: 900_010,
      hashrate: null,
      difficultyAdjustment: null,
      mempoolBlocks: [
        { blockVSize: 1_250_000, nTx: 2800, medianFee: 6, feeRange: [2, 12] },
        { blockVSize: 950_000, nTx: 2400, medianFee: 4, feeRange: [1, 8] },
      ],
      recentBlocks: [
        { height: 900_010, timestamp: 1_710_001_200, tx_count: 2400, size: 1_420_000 },
        { height: 900_009, timestamp: 1_710_000_540, tx_count: 2100, size: 1_360_000 },
        { height: 900_008, timestamp: 1_709_999_940, tx_count: 2200, size: 1_300_000 },
      ],
      fetchedAt: "2026-03-23T12:00:00.000Z",
    });

    expect(dto.activity).toEqual({
      averageBlockTimeMinutes: 10.5,
      averageTransactionsPerBlock: 2233,
      averageBlockSizeBytes: 1360000,
    });
    expect(dto.mempool.backlogBlocks).toBe(2.2);
    expect(dto.feeSpread).toEqual({
      fastestToHour: 7,
      hourToMinimum: 3,
      fastestToMinimum: 10,
    });
  });
});
