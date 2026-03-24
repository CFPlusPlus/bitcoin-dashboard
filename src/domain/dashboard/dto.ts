import type { Currency } from "../../lib/currency";

export type { Currency };
export type ChartRange = 1 | 7 | 30;
export type PerformanceWindowKey = "7d" | "30d" | "90d" | "1y" | "ytd";
export type CacheDataSource = "api" | "kv" | "stale";

export type CacheMeta = {
  source: CacheDataSource;
  ageSeconds: number;
};

export type ApiEnvelope = {
  source: string;
  fetchedAt: string;
  cache?: CacheMeta;
  partial?: boolean;
  warnings?: string[];
};

export type OverviewDto = ApiEnvelope & {
  currency: Currency;
  referenceUsdPrice: number | null;
  name: string;
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
  marketCapChange24h: number | null;
  marketCapChange24hPercent: number | null;
  marketCapRank: number | null;
  fullyDilutedValuation: number | null;
  volume24h: number | null;
  volumeMarketCapRatio: number | null;
  btcDominance: number | null;
  circulatingSupply: number | null;
  maxSupply: number | null;
  supplyProgressPercent: number | null;
  ath: number | null;
  athDate: string | null;
  athChangePercent: number | null;
  atl: number | null;
  atlDate: string | null;
  atlChangePercent: number | null;
  high24h: number | null;
  low24h: number | null;
  lastUpdatedAt: string | null;
};

export type NetworkDto = ApiEnvelope & {
  latestBlockHeight: number | null;
  halving: {
    progressPercent: number | null;
    estimatedDaysUntil: number | null;
    remainingBlocks: number | null;
    nextHalvingHeight: number | null;
    estimatedDate: string | null;
    currentReward: number | null;
    nextReward: number | null;
  };
  fees: {
    fastestFee: number | null;
    halfHourFee: number | null;
    hourFee: number | null;
    economyFee: number | null;
    minimumFee: number | null;
  };
  feeSpread: {
    fastestToHour: number | null;
    hourToMinimum: number | null;
    fastestToMinimum: number | null;
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
  activity: {
    averageBlockTimeMinutes: number | null;
    averageTransactionsPerBlock: number | null;
    averageBlockSizeBytes: number | null;
  };
  mempool: {
    pendingTransactions: number | null;
    pendingVirtualSizeMb: number | null;
    backlogBlocks: number | null;
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
  average7d: number | null;
  change7d: number | null;
  timeUntilUpdateSeconds: number | null;
  nextUpdateAt: string | null;
  attribution: string;
};

export type OnChainActivityDto = ApiEnvelope & {
  activeAddresses: {
    current: number | null;
    change7dPercent: number | null;
    average7d: number | null;
    points: Array<{
      timestamp: string;
      value: number;
    }>;
  };
  nonZeroAddresses: {
    current: number | null;
    change7dPercent: number | null;
    average7d: number | null;
    points: Array<{
      timestamp: string;
      value: number;
    }>;
  };
  transactionCount: {
    current: number | null;
    change7dPercent: number | null;
    average7d: number | null;
    points: Array<{
      timestamp: string;
      value: number;
    }>;
  };
  transferCount: {
    current: number | null;
    change7dPercent: number | null;
    average7d: number | null;
    points: Array<{
      timestamp: string;
      value: number;
    }>;
  };
  dailyFeesBtc: {
    current: number | null;
    change7dPercent: number | null;
    average7d: number | null;
    points: Array<{
      timestamp: string;
      value: number;
    }>;
  };
  derived: {
    transfersPerTransaction: number | null;
    nonZeroAddressesChange7dPercent: number | null;
    averageDailyFees7dBtc: number | null;
  };
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
  stats: {
    high52w: {
      price: number | null;
      timestamp: number | null;
    };
    low52w: {
      price: number | null;
      timestamp: number | null;
    };
    distanceFromHigh52wPercent: number | null;
    movingAverage200d: number | null;
    distanceFromMovingAverage200dPercent: number | null;
    volatility30dPercent: number | null;
    volatility90dPercent: number | null;
  };
};
