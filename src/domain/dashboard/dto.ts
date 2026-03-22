import type { Currency } from "../../lib/currency";

export type { Currency };
export type ChartRange = 1 | 7 | 30;
export type PerformanceWindowKey = "7d" | "30d" | "1y" | "ytd";

export type ApiEnvelope = {
  source: string;
  fetchedAt: string;
  partial?: boolean;
  warnings?: string[];
};

export type OverviewDto = ApiEnvelope & {
  currency: Currency;
  name: string;
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  btcDominance: number | null;
  high24h: number | null;
  low24h: number | null;
  lastUpdatedAt: string | null;
};

export type NetworkDto = ApiEnvelope & {
  latestBlockHeight: number | null;
  fees: {
    fastestFee: number | null;
    halfHourFee: number | null;
    hourFee: number | null;
    economyFee: number | null;
    minimumFee: number | null;
  };
  hashrate: {
    currentEhPerSecond: number | null;
    changePercent30d: number | null;
    points: Array<{
      timestamp: number;
      ehPerSecond: number;
    }>;
    stats: {
      low30d: number | null;
      high30d: number | null;
      average30d: number | null;
    };
  };
  difficulty: {
    current: number | null;
    adjustmentPercent: number | null;
    progressPercent: number | null;
    remainingBlocks: number | null;
    nextRetargetHeight: number | null;
    estimatedRetargetDate: string | null;
  };
  mempool: {
    pendingTransactions: number | null;
    pendingVirtualSizeMb: number | null;
    projectedBlocks: Array<{
      blockIndex: number;
      transactionCount: number | null;
      minFeeRate: number | null;
      maxFeeRate: number | null;
      medianFeeRate: number | null;
    }>;
  };
  latestBlocks: Array<{
    height: number;
    timestamp: number;
    transactionCount: number | null;
    sizeBytes: number | null;
  }>;
};

export type SentimentDto = ApiEnvelope & {
  name: string;
  value: number | null;
  classification: string | null;
  timestamp: string | null;
  timeUntilUpdateSeconds: number | null;
  nextUpdateAt: string | null;
  attribution: string;
};

export type ChartPointDto = {
  timestamp: number;
  price: number;
};

export type MarketContextMetricKey = "marketCap" | "volume24h";

export type MarketContextChartPointDto = {
  timestamp: number;
  value: number;
};

export type MarketContextChartSeriesDto = {
  key: MarketContextMetricKey;
  points: MarketContextChartPointDto[];
  stats: {
    currentValue: number | null;
    minValue: number | null;
    maxValue: number | null;
  };
};

export type ChartDto = ApiEnvelope & {
  currency: Currency;
  range: ChartRange;
  points: ChartPointDto[];
  stats: {
    currentPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
  };
};

export type MarketContextChartDto = ApiEnvelope & {
  currency: Currency;
  range: 30;
  series: MarketContextChartSeriesDto[];
};

export type PerformanceWindowDto = {
  key: PerformanceWindowKey;
  referencePrice: number | null;
  referenceTimestamp: number | null;
  changePercent: number | null;
};

export type PerformanceDto = ApiEnvelope & {
  currency: Currency;
  currentPrice: number | null;
  periods: PerformanceWindowDto[];
};
