import type {
  ChartDto,
  Currency,
  MarketContextChartDto,
  NetworkDto,
  OnChainActivityDto,
  OverviewDto,
  PerformanceDto,
  SentimentDto,
} from "../domain/dashboard/dto";

export type {
  ChartDto as ChartData,
  ChartPointDto as ChartPoint,
  ChartRange,
  MarketContextChartDto as MarketContextChartData,
  MarketContextChartPointDto as MarketContextChartPoint,
  MarketContextChartSeriesDto as MarketContextChartSeries,
  MarketContextMetricKey,
  NetworkDto as Network,
  OnChainActivityDto as OnChainActivity,
  OverviewDto as Overview,
  PerformanceDto as Performance,
  PerformanceWindowDto as PerformanceWindow,
  PerformanceWindowKey,
  SentimentDto as Sentiment,
} from "../domain/dashboard/dto";

export type { Currency } from "../domain/dashboard/dto";

export type DashboardBundleSectionError = {
  message: string;
  status: number;
};

export type DashboardBundleSection<T> = {
  data: T | null;
  error: DashboardBundleSectionError | null;
};

export type DashboardCoreBundle = {
  fetchedAt: string;
  sections: {
    overview: DashboardBundleSection<OverviewDto>;
    chart: DashboardBundleSection<ChartDto>;
    network: DashboardBundleSection<NetworkDto>;
  };
};

export type DashboardSlowBundle = {
  fetchedAt: string;
  sections: {
    onChainActivity: DashboardBundleSection<OnChainActivityDto>;
    sentiment: DashboardBundleSection<SentimentDto>;
    performance: DashboardBundleSection<PerformanceDto>;
    marketContextChart: DashboardBundleSection<MarketContextChartDto>;
  };
};

export type DcaEntry = {
  id: string;
  date: string;
  amountInvested: number;
  bitcoinPrice: number;
  note: string;
};

export type DcaEntryStore = Partial<Record<Currency, DcaEntry[]>>;

export type DcaEntrySnapshot = DcaEntry & {
  bitcoinAmount: number;
};

export type DcaSummary = {
  totalEntries: number;
  totalInvested: number;
  totalBitcoin: number;
  averageBuyPrice: number | null;
  currentPrice: number | null;
  currentValue: number | null;
  pnlAbsolute: number | null;
  pnlPercent: number | null;
};
