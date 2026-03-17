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
  network: Network;
  overview: Overview;
  range: ChartRange;
  sentiment: Sentiment | null;
  sentimentError: string;
  sentimentLoading: boolean;
  showChartSkeleton: boolean;
  showSentimentSkeleton: boolean;
  onRangeChange: (value: ChartRange) => void;
};

export default function DashboardContent({
  chart,
  chartError,
  chartLoading,
  currency,
  network,
  overview,
  range,
  sentiment,
  sentimentError,
  sentimentLoading,
  showChartSkeleton,
  showSentimentSkeleton,
  onRangeChange,
}: DashboardContentProps) {
  return (
    <section className="grid" aria-label="Dashboard Bereiche">
      <MarketOverviewSection currency={currency} overview={overview} />

      <NetworkOverviewSection network={network} />

      <SentimentSection
        sentiment={sentiment}
        sentimentError={sentimentError}
        sentimentLoading={sentimentLoading}
        showSentimentSkeleton={showSentimentSkeleton}
      />

      <ChartSection
        chart={chart}
        chartError={chartError}
        chartLoading={chartLoading}
        currency={currency}
        range={range}
        showChartSkeleton={showChartSkeleton}
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
