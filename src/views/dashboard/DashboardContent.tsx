import type {
  ChartData,
  ChartRange,
  Currency,
  Network,
  Overview,
  Sentiment,
} from "../../types/dashboard";
import ChartSection from "../../components/ChartSection";
import MetadataSection from "../../components/MetadataSection";
import Section from "../../components/ui/layout/Section";
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
    <Section aria-label="Dashboard Bereiche" space="lg">
      <MarketOverviewSection
        currency={currency}
        overview={overview}
        overviewError={overviewError}
        overviewLoading={overviewLoading}
        showOverviewSkeleton={showOverviewSkeleton}
        onRetry={onOverviewRetry}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
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
      </div>

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
    </Section>
  );
}
