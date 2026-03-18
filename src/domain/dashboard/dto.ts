export type Currency = "usd" | "eur";
export type ChartRange = 1 | 7 | 30;
export type PerformanceWindowKey = "7d" | "30d" | "1y" | "ytd";

export type ApiEnvelope = {
  source: string;
  fetchedAt: string;
  partial?: boolean;
  warnings?: string[];
};

export type OverviewDto = ApiEnvelope & {
  name: string;
  priceUsd: number | null;
  priceEur: number | null;
  change24hUsd: number | null;
  change24hEur: number | null;
  marketCapUsd: number | null;
  marketCapEur: number | null;
  volume24hUsd: number | null;
  volume24hEur: number | null;
  high24hUsd: number | null;
  high24hEur: number | null;
  low24hUsd: number | null;
  low24hEur: number | null;
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
