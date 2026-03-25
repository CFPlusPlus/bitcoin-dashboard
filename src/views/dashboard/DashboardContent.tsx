"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type {
  ChartData,
  ChartRange,
  Currency,
  MarketContextChartData,
  Network,
  OnChainActivity,
  Overview,
  Performance,
  Sentiment,
} from "../../types/dashboard";
import MetadataSection from "../../components/MetadataSection";
import Section from "../../components/ui/layout/Section";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import { useI18n } from "../../i18n/context";
import AthSection from "./AthSection";
import HalvingSection from "./HalvingSection";
import MarketContextSection from "./MarketContextSection";
import NetworkHighlightsSection from "./NetworkHighlightsSection";
import NetworkOverviewSection from "./NetworkOverviewSection";
import OnChainActivitySection from "./OnChainActivitySection";
import PerformanceSection from "./PerformanceSection";
import SentimentSection from "./SentimentSection";
import ToolsPreviewSection from "./ToolsPreviewSection";

type DashboardContentProps = {
  chart: ChartData | null;
  chartState: AsyncDataState<ChartData>;
  currency: Currency;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
  halvingState: AsyncDataState<Network>;
  marketContextChart: MarketContextChartData | null;
  marketContextChartState: AsyncDataState<MarketContextChartData>;
  network: Network | null;
  networkState: AsyncDataState<Network>;
  onChainActivity: OnChainActivity | null;
  onChainActivityState: AsyncDataState<OnChainActivity>;
  onChartRetry: () => void;
  onDashboardRetry: () => void;
  onMarketContextChartRetry: () => void;
  onNetworkRetry: () => void;
  onOnChainActivityRetry: () => void;
  onOverviewRetry: () => void;
  onPerformanceRetry: () => void;
  onRangeChange: (value: ChartRange) => void;
  onSentimentRetry: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
  performance: Performance | null;
  performanceState: AsyncDataState<Performance>;
  range: ChartRange;
  sentiment: Sentiment | null;
  sentimentState: AsyncDataState<Sentiment>;
};

export default function DashboardContent(props: DashboardContentProps) {
  const { messages } = useI18n();
  const copy = messages.dashboard;
  const networkCopy = messages.dashboard.network;

  return (
    <Section aria-label={copy.contentAriaLabel} space="lg" className="gap-8 xl:gap-10">
      <Section
        as="section"
        aria-label={copy.marketAndSentimentAriaLabel}
        space="md"
        className="gap-6"
      >
        <SectionHeader
          eyebrow={copy.marketAndSentimentEyebrow}
          title={copy.marketAndSentimentTitle}
          description={copy.marketAndSentimentDescription}
        />

        <PerformanceSection
          currency={props.currency}
          performance={props.performance}
          performanceState={props.performanceState}
          onRetry={props.onPerformanceRetry}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] xl:items-start">
          <MarketContextSection
            currency={props.currency}
            marketContextChart={props.marketContextChart}
            marketContextChartState={props.marketContextChartState}
            onChartRetry={props.onMarketContextChartRetry}
            overview={props.overview}
            overviewState={props.overviewState}
            onRetry={props.onOverviewRetry}
          />

          <SentimentSection
            sentiment={props.sentiment}
            sentimentState={props.sentimentState}
            onRetry={props.onSentimentRetry}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <AthSection
            currency={props.currency}
            overview={props.overview}
            overviewState={props.overviewState}
            onRetry={props.onOverviewRetry}
          />

          <HalvingSection
            network={props.network}
            halvingState={props.halvingState}
            onRetry={props.onNetworkRetry}
          />
        </div>
      </Section>

      <Section as="section" aria-label={networkCopy.title} space="md" className="gap-6">
        <SectionHeader
          eyebrow={networkCopy.eyebrow}
          title={networkCopy.title}
          description={networkCopy.description}
        />

        <NetworkHighlightsSection
          network={props.network}
          networkState={props.networkState}
          onRetry={props.onNetworkRetry}
        />

        <NetworkOverviewSection
          network={props.network}
          networkState={props.networkState}
          onRetry={props.onNetworkRetry}
        />

        <OnChainActivitySection
          onChainActivity={props.onChainActivity}
          onChainActivityState={props.onChainActivityState}
          onRetry={props.onOnChainActivityRetry}
        />
      </Section>

      <ToolsPreviewSection />

      <MetadataSection
        chart={props.chart}
        currency={props.currency}
        dashboardState={props.dashboardState}
        network={props.network}
        onRetry={props.onDashboardRetry}
        overview={props.overview}
        sentiment={props.sentiment}
      />
    </Section>
  );
}
