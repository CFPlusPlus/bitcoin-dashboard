import type { Currency } from "../domain/dashboard/dto";

export type {
  ChartDto as ChartData,
  ChartPointDto as ChartPoint,
  ChartRange,
  NetworkDto as Network,
  OverviewDto as Overview,
  PerformanceDto as Performance,
  PerformanceWindowDto as PerformanceWindow,
  PerformanceWindowKey,
  SentimentDto as Sentiment,
} from "../domain/dashboard/dto";

export type { Currency } from "../domain/dashboard/dto";

export type DcaEntry = {
  id: string;
  date: string;
  amountInvested: number;
  bitcoinPrice: number;
  note: string;
};

export type DcaEntryStore = Record<Currency, DcaEntry[]>;

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
