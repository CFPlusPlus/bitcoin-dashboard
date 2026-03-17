import ChartSection from "../../components/ChartSection";
import MetadataSection from "../../components/MetadataSection";
import type {
  ChartData,
  ChartRange,
  Currency,
  Network,
  Overview,
  Sentiment,
} from "../../types/dashboard";
import MarketOverviewSection from "./MarketOverviewSection";
import NetworkOverviewSection from "./NetworkOverviewSection";
import SentimentSection from "./SentimentSection";

type DashboardContentProps = {
  chart: ChartData | null;
  chartError: string;
  chartLoading: boolean;
  currency: Currency;
  network: Network | null;
  networkError: string;
  networkLoading: boolean;
  overview: Overview | null;
  overviewError: string;
  overviewLoading: boolean;
  range: ChartRange;
  sentiment: Sentiment | null;
  sentimentError: string;
  sentimentLoading: boolean;
  showChartSkeleton: boolean;
  showNetworkSkeleton: boolean;
  showOverviewSkeleton: boolean;
  showSentimentSkeleton: boolean;
  onChartRetry: () => void;
  onNetworkRetry: () => void;
  onOverviewRetry: () => void;
  onSentimentRetry: () => void;
  onRangeChange: (value: ChartRange) => void;
};

export default function DashboardContent({
  chart,
  chartError,
  chartLoading,
  currency,
  network,
  networkError,
  networkLoading,
  overview,
  overviewError,
  overviewLoading,
  range,
  sentiment,
  sentimentError,
  sentimentLoading,
  showChartSkeleton,
  showNetworkSkeleton,
  showOverviewSkeleton,
  showSentimentSkeleton,
  onChartRetry,
  onNetworkRetry,
  onOverviewRetry,
  onSentimentRetry,
  onRangeChange,
}: DashboardContentProps) {
  return (
    <section className="grid" aria-label="Dashboard Bereiche">
      <MarketOverviewSection
        currency={currency}
        overview={overview}
        overviewError={overviewError}
        overviewLoading={overviewLoading}
        showOverviewSkeleton={showOverviewSkeleton}
        onRetry={onOverviewRetry}
      />

      <NetworkOverviewSection
        network={network}
        networkError={networkError}
        networkLoading={networkLoading}
        showNetworkSkeleton={showNetworkSkeleton}
        onRetry={onNetworkRetry}
      />

      <SentimentSection
        sentiment={sentiment}
        sentimentError={sentimentError}
        sentimentLoading={sentimentLoading}
        showSentimentSkeleton={showSentimentSkeleton}
        onRetry={onSentimentRetry}
      />

      <ChartSection
        chart={chart}
        chartError={chartError}
        chartLoading={chartLoading}
        currency={currency}
        range={range}
        showChartSkeleton={showChartSkeleton}
        onRetry={onChartRetry}
        onRangeChange={onRangeChange}
      />

      <MetadataSection
        chart={chart}
        currency={currency}
        network={network}
        overview={overview}
        sentiment={sentiment}
      />
    </section>
  );
}
