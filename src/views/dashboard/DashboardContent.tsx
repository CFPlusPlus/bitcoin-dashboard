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
import AthSection from "./AthSection";
import ChartSection from "../../components/ChartSection";
import MetadataSection from "../../components/MetadataSection";
import Section from "../../components/ui/layout/Section";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import { useI18n } from "../../i18n/context";
import MarketContextSection from "./MarketContextSection";
import NetworkOverviewSection from "./NetworkOverviewSection";
import OverviewSection from "./OverviewSection";
import PerformanceSection from "./PerformanceSection";
import SentimentSection from "./SentimentSection";
import HalvingSection from "./HalvingSection";
import ToolsPreviewSection from "./ToolsPreviewSection";
import OnChainActivitySection from "./OnChainActivitySection";

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

  return (
    <Section aria-label={copy.contentAriaLabel} space="lg">
      <OverviewSection
        currency={props.currency}
        overview={props.overview}
        overviewState={props.overviewState}
        onRetry={props.onOverviewRetry}
      />

      <AthSection
        currency={props.currency}
        overview={props.overview}
        overviewState={props.overviewState}
        onRetry={props.onOverviewRetry}
      />

      <PerformanceSection
        currency={props.currency}
        performance={props.performance}
        performanceState={props.performanceState}
        onRetry={props.onPerformanceRetry}
      />

      <ChartSection
        chart={props.chart}
        chartState={props.chartState}
        currency={props.currency}
        range={props.range}
        onRetry={props.onChartRetry}
        onRangeChange={props.onRangeChange}
      />

      <Section as="section" aria-label={copy.marketAndSentimentAriaLabel} space="md">
        <SectionHeader
          eyebrow={copy.marketAndSentimentEyebrow}
          title={copy.marketAndSentimentTitle}
          description={copy.marketAndSentimentDescription}
        />

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <SentimentSection
            sentiment={props.sentiment}
            sentimentState={props.sentimentState}
            onRetry={props.onSentimentRetry}
          />

          <MarketContextSection
            currency={props.currency}
            marketContextChart={props.marketContextChart}
            marketContextChartState={props.marketContextChartState}
            onChartRetry={props.onMarketContextChartRetry}
            overview={props.overview}
            overviewState={props.overviewState}
            onRetry={props.onOverviewRetry}
          />
        </div>
      </Section>

      <OnChainActivitySection
        onChainActivity={props.onChainActivity}
        onChainActivityState={props.onChainActivityState}
        onRetry={props.onOnChainActivityRetry}
      />

      <NetworkOverviewSection
        network={props.network}
        networkState={props.networkState}
        onRetry={props.onNetworkRetry}
      />

      <HalvingSection
        network={props.network}
        halvingState={props.halvingState}
        onRetry={props.onNetworkRetry}
      />

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
