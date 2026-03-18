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
import SectionHeader from "../../components/ui/layout/SectionHeader";
import MarketContextSection from "./MarketContextSection";
import NetworkOverviewSection from "./NetworkOverviewSection";
import OverviewSection from "./OverviewSection";
import SentimentSection from "./SentimentSection";
import ToolsPreviewSection from "./ToolsPreviewSection";

type DashboardContentProps = {
  chart: ChartData | null;
  chartState: AsyncDataState<ChartData>;
  currency: Currency;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
  network: Network | null;
  networkState: AsyncDataState<Network>;
  onChartRetry: () => void;
  onDashboardRetry: () => void;
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
  dashboardState,
  network,
  networkState,
  onChartRetry,
  onDashboardRetry,
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
      <OverviewSection
        currency={currency}
        overview={overview}
        overviewState={overviewState}
        onRetry={onOverviewRetry}
      />

      <ChartSection
        chart={chart}
        chartState={chartState}
        currency={currency}
        range={range}
        onRetry={onChartRetry}
        onRangeChange={onRangeChange}
      />

      <Section as="section" aria-label="Marktkontext und Sentiment" space="md">
        <SectionHeader
          eyebrow="Sekundaerer Kontext"
          title="Stimmung und Marktgroesse"
          description="Nach Preis und Chart folgen die kompakten Signale, die das Marktbild schneller einordnen helfen."
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <SentimentSection
            sentiment={sentiment}
            sentimentState={sentimentState}
            onRetry={onSentimentRetry}
          />

          <MarketContextSection
            currency={currency}
            overview={overview}
            overviewState={overviewState}
            onRetry={onOverviewRetry}
          />
        </div>
      </Section>

      <NetworkOverviewSection network={network} networkState={networkState} onRetry={onNetworkRetry} />

      <ToolsPreviewSection />

      <MetadataSection
        chart={chart}
        currency={currency}
        dashboardState={dashboardState}
        network={network}
        onRetry={onDashboardRetry}
        overview={overview}
        sentiment={sentiment}
      />
    </Section>
  );
}
