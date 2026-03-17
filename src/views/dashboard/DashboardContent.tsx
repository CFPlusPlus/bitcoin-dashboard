import type { AsyncDataState } from "../../lib/data-state";
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
  chartState: AsyncDataState<ChartData>;
  currency: Currency;
  network: Network | null;
  networkState: AsyncDataState<Network>;
  onChartRetry: () => void;
  onNetworkRetry: () => void;
  onOverviewRetry: () => void;
  onRangeChange: (value: ChartRange) => void;
  onSentimentRetry: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
  range: ChartRange;
  sentiment: Sentiment | null;
  sentimentState: AsyncDataState<Sentiment>;
};

export default function DashboardContent({
  chart,
  chartState,
  currency,
  network,
  networkState,
  onChartRetry,
  onNetworkRetry,
  onOverviewRetry,
  onRangeChange,
  onSentimentRetry,
  overview,
  overviewState,
  range,
  sentiment,
  sentimentState,
}: DashboardContentProps) {
  return (
    <Section aria-label="Dashboard Bereiche" space="lg">
      <MarketOverviewSection
        currency={currency}
        overview={overview}
        overviewState={overviewState}
        onRetry={onOverviewRetry}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <NetworkOverviewSection network={network} networkState={networkState} onRetry={onNetworkRetry} />

        <SentimentSection
          sentiment={sentiment}
          sentimentState={sentimentState}
          onRetry={onSentimentRetry}
        />
      </div>

      <ChartSection
        chart={chart}
        chartState={chartState}
        currency={currency}
        range={range}
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
