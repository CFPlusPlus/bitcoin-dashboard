import { describe, expect, it } from "vitest";
import type { Network } from "../types/dashboard";
import { getDashboardNoticeCandidates } from "./dashboard-notices";

const networkFixture: Network = {
  source: "test",
  fetchedAt: "2026-03-24T08:00:00.000Z",
  latestBlockHeight: 900001,
  halving: {
    progressPercent: 28.57,
    estimatedDaysUntil: 1042,
    remainingBlocks: 149999,
    nextHalvingHeight: 1050000,
    estimatedDate: "2029-01-25T09:50:00.000Z",
    currentReward: 3.125,
    nextReward: 1.5625,
  },
  fees: {
    fastestFee: 8,
    halfHourFee: 6,
    hourFee: 4,
    economyFee: 2,
    minimumFee: 1,
  },
  feeSpread: {
    fastestToHour: 4,
    hourToMinimum: 3,
    fastestToMinimum: 7,
  },
  hashrate: {
    currentEhPerSecond: 650,
    changePercent30d: 3.5,
    points: [{ timestamp: 1710000000, ehPerSecond: 640 }],
    stats: {
      low30d: 600,
      high30d: 670,
      average30d: 635,
    },
  },
  difficulty: {
    current: 92000000000000,
    adjustmentPercent: 2.3,
    progressPercent: 80,
    remainingBlocks: 400,
    nextRetargetHeight: 900400,
    estimatedRetargetDate: "2026-03-24T08:00:00.000Z",
  },
  activity: {
    averageBlockTimeMinutes: 9.8,
    averageTransactionsPerBlock: 2480,
    averageBlockSizeBytes: 1360000,
  },
  mempool: {
    pendingTransactions: 12345,
    pendingVirtualSizeMb: 52,
    backlogBlocks: 52,
    projectedBlocks: [],
  },
  latestBlocks: [],
};

describe("dashboard-notices", () => {
  it("ignores smaller network partial issues for the global notice bar", () => {
    const network: Network = {
      ...networkFixture,
      difficulty: {
        ...networkFixture.difficulty,
        adjustmentPercent: null,
        progressPercent: null,
      },
    };

    expect(
      getDashboardNoticeCandidates({
        locale: "de",
        network,
        networkState: {
          error: null,
          hasUsableData: true,
          isLoading: false,
        },
      })
    ).toEqual([]);
  });

  it("creates a notice candidate when critical network values are missing", () => {
    const network: Network = {
      ...networkFixture,
      latestBlockHeight: null,
    };

    expect(
      getDashboardNoticeCandidates({
        locale: "de",
        network,
        networkState: {
          error: null,
          hasUsableData: true,
          isLoading: false,
        },
      })
    ).toEqual([
      {
        key: "network-critical-loss",
        message:
          "Wichtige Netzwerkdaten sind seit einigen Minuten nur eingeschränkt verfügbar. Vorhandene Kennzahlen bleiben sichtbar.",
      },
    ]);
  });

  it("creates a notice candidate when network data is unavailable", () => {
    expect(
      getDashboardNoticeCandidates({
        locale: "de",
        network: null,
        networkState: {
          error: "Netzwerkdaten sind gerade nicht verfügbar.",
          hasUsableData: false,
          isLoading: false,
        },
      })
    ).toEqual([
      {
        key: "network-unavailable",
        message:
          "Netzwerkdaten sind seit einigen Minuten nicht verlässlich verfügbar. Bitte später erneut laden.",
      },
    ]);
  });
});
