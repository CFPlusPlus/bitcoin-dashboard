import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "../test/msw/server";
import { useDashboardData } from "./useDashboardData";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const fetchedAt = "2026-03-19T12:00:00.000Z";

const overviewFixture = {
  source: "test",
  fetchedAt,
  name: "Bitcoin",
  currency: "usd",
  referenceUsdPrice: 60000,
  price: 60000,
  change24h: 1.2,
  marketCap: 1200000000000,
  marketCapRank: 1,
  fullyDilutedValuation: 1260000000000,
  volume24h: 20000000000,
  btcDominance: 56,
  circulatingSupply: 19850000,
  maxSupply: 21000000,
  supplyProgressPercent: 94.52,
  ath: 73000,
  athDate: "2026-03-14T00:00:00.000Z",
  athChangePercent: -17.81,
  high24h: 61000,
  low24h: 59000,
  lastUpdatedAt: fetchedAt,
  warnings: [],
};

const networkFixture = {
  source: "test",
  fetchedAt,
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
    estimatedRetargetDate: fetchedAt,
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
    projectedBlocks: [
      {
        blockIndex: 0,
        transactionCount: 2800,
        minFeeRate: 1,
        maxFeeRate: 14,
        medianFeeRate: 5,
      },
    ],
  },
  latestBlocks: [
    {
      height: 900001,
      timestamp: 1710001000,
      transactionCount: 2310,
      sizeBytes: 1340000,
    },
  ],
  warnings: [],
};

const sentimentFixture = {
  source: "test",
  fetchedAt,
  name: "Fear & Greed",
  value: 62,
  classification: "Greed",
  timestamp: fetchedAt,
  timeUntilUpdateSeconds: 3600,
  nextUpdateAt: fetchedAt,
  attribution: "Alternative.me",
  warnings: [],
};

const chartFixture = {
  source: "test",
  fetchedAt,
  currency: "usd" as const,
  range: 1 as const,
  points: [
    { timestamp: 1710000000, price: 59000 },
    { timestamp: 1710003600, price: 60000 },
  ],
  stats: {
    currentPrice: 60000,
    minPrice: 59000,
    maxPrice: 60000,
  },
  warnings: [],
};

const performanceFixture = {
  source: "test",
  fetchedAt,
  currency: "usd" as const,
  currentPrice: 60000,
  periods: [
    {
      key: "7d" as const,
      referencePrice: 57000,
      referenceTimestamp: 1709400000,
      changePercent: 5.2,
    },
    {
      key: "30d" as const,
      referencePrice: 54000,
      referenceTimestamp: 1707400000,
      changePercent: 11.1,
    },
    {
      key: "90d" as const,
      referencePrice: 51000,
      referenceTimestamp: 1701475200,
      changePercent: 17.6,
    },
    {
      key: "1y" as const,
      referencePrice: 34000,
      referenceTimestamp: 1678500000,
      changePercent: 76.4,
    },
    {
      key: "ytd" as const,
      referencePrice: 50000,
      referenceTimestamp: 1704067200,
      changePercent: 20.0,
    },
  ],
  stats: {
    high52w: {
      price: 68000,
      timestamp: 1710003600,
    },
    low52w: {
      price: 31000,
      timestamp: 1678500000,
    },
    distanceFromHigh52wPercent: -11.8,
    movingAverage200d: 54000,
    distanceFromMovingAverage200dPercent: 11.1,
    volatility30dPercent: 42.6,
    volatility90dPercent: 55.3,
  },
  warnings: [],
};

const marketContextChartFixture = {
  source: "test",
  fetchedAt,
  currency: "usd" as const,
  range: 30 as const,
  series: [
    {
      key: "marketCap" as const,
      points: [{ timestamp: 1710000000, value: 1200000000000 }],
      stats: {
        currentValue: 1200000000000,
        minValue: 1100000000000,
        maxValue: 1250000000000,
      },
    },
    {
      key: "volume24h" as const,
      points: [{ timestamp: 1710000000, value: 20000000000 }],
      stats: {
        currentValue: 20000000000,
        minValue: 15000000000,
        maxValue: 24000000000,
      },
    },
  ],
  warnings: [],
};

function setupHandlers(counter: Record<string, number>) {
  server.use(
    http.get("/api/overview", () => {
      counter.overview += 1;
      return HttpResponse.json(overviewFixture);
    }),
    http.get("/api/network", () => {
      counter.network += 1;
      return HttpResponse.json(networkFixture);
    }),
    http.get("/api/sentiment", () => {
      counter.sentiment += 1;
      return HttpResponse.json(sentimentFixture);
    }),
    http.get("/api/chart", () => {
      counter.chart += 1;
      return HttpResponse.json(chartFixture);
    }),
    http.get("/api/performance", () => {
      counter.performance += 1;
      return HttpResponse.json(performanceFixture);
    }),
    http.get("/api/market-context-chart", () => {
      counter.marketContextChart += 1;
      return HttpResponse.json(marketContextChartFixture);
    })
  );
}

describe("useDashboardData", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("loads all dashboard sections and returns success states", async () => {
    window.localStorage.setItem("bitcoin-dashboard:auto-refresh", JSON.stringify(false));
    const counter = {
      overview: 0,
      network: 0,
      sentiment: 0,
      chart: 0,
      performance: 0,
      marketContextChart: 0,
    };
    setupHandlers(counter);

    const { result } = renderHook(() => useDashboardData("de"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.overview?.price).toBe(60000);
      expect(result.current.network?.latestBlockHeight).toBe(900001);
      expect(result.current.chart?.points.length).toBe(2);
      expect(result.current.performance?.periods[0]?.key).toBe("7d");
      expect(result.current.marketContextChart?.series[0]?.key).toBe("marketCap");
    });

    expect(result.current.dashboardState.status).toBe("success");

    expect(counter.overview).toBe(1);
    expect(counter.network).toBe(1);
    expect(counter.sentiment).toBe(1);
    expect(counter.chart).toBe(1);
    expect(counter.performance).toBe(1);
    expect(counter.marketContextChart).toBe(1);
  });

  it("refetches all endpoints on refreshAll", async () => {
    window.localStorage.setItem("bitcoin-dashboard:auto-refresh", JSON.stringify(false));
    const counter = {
      overview: 0,
      network: 0,
      sentiment: 0,
      chart: 0,
      performance: 0,
      marketContextChart: 0,
    };
    setupHandlers(counter);

    const { result } = renderHook(() => useDashboardData("de"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.dashboardState.status).toBe("success");
    });

    await act(async () => {
      await result.current.refreshAll(result.current.range, result.current.currency);
    });

    await waitFor(() => {
      expect(counter.overview).toBe(2);
      expect(counter.network).toBe(2);
      expect(counter.sentiment).toBe(2);
      expect(counter.chart).toBe(2);
      expect(counter.performance).toBe(2);
      expect(counter.marketContextChart).toBe(2);
    });
  });
});
