"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { DashboardSectionId } from "../../lib/dashboard-workspace";
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
import BitcoinNowSection from "./BitcoinNowSection";

type DashboardContentProps = {
  autoRefresh: boolean;
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
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
  performance: Performance | null;
  performanceState: AsyncDataState<Performance>;
  range: ChartRange;
  refreshing: boolean;
  section: DashboardSectionId;
  sentiment: Sentiment | null;
  sentimentState: AsyncDataState<Sentiment>;
  warnings: string[];
};

export default function DashboardContent(props: DashboardContentProps) {
  const { messages } = useI18n();
  const copy = messages.dashboard;
  const networkCopy = messages.dashboard.network;

  if (props.section === "overview") {
    return (
      <Section aria-label={copy.contentAriaLabel} space="lg" className="gap-8 xl:gap-10">
        <BitcoinNowSection
          autoRefresh={props.autoRefresh}
          chart={props.chart}
          chartState={props.chartState}
          currency={props.currency}
          dashboardState={props.dashboardState}
          halvingState={props.halvingState}
          network={props.network}
          networkState={props.networkState}
          refreshing={props.refreshing}
          onAutoRefreshChange={props.onAutoRefreshChange}
          onChartRetry={props.onChartRetry}
          onNetworkRetry={props.onNetworkRetry}
          onOverviewRetry={props.onOverviewRetry}
          onRangeChange={props.onRangeChange}
          onRefresh={props.onRefresh}
          onSentimentRetry={props.onSentimentRetry}
          overview={props.overview}
          overviewState={props.overviewState}
          range={props.range}
          sentiment={props.sentiment}
          sentimentState={props.sentimentState}
          warnings={props.warnings}
        />

        <ToolsPreviewSection />
      </Section>
    );
  }

  if (props.section === "performance") {
    return (
      <PerformanceSection
        currency={props.currency}
        performance={props.performance}
        performanceState={props.performanceState}
        onRetry={props.onPerformanceRetry}
      />
    );
  }

  if (props.section === "market") {
    return (
      <Section aria-label={copy.marketAndSentimentAriaLabel} space="lg" className="gap-8 xl:gap-10">
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
      </Section>
    );
  }

  if (props.section === "cycle") {
    return (
      <Section as="section" aria-label={copy.cycleAriaLabel} space="md" className="gap-6">
        <SectionHeader
          eyebrow={copy.cycleEyebrow}
          title={copy.cycleTitle}
          description={copy.cycleDescription}
        />
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
    );
  }

  if (props.section === "network") {
    return (
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
      </Section>
    );
  }

  if (props.section === "onchain") {
    return (
      <OnChainActivitySection
        onChainActivity={props.onChainActivity}
        onChainActivityState={props.onChainActivityState}
        onRetry={props.onOnChainActivityRetry}
      />
    );
  }

  return (
    <MetadataSection
      chart={props.chart}
      currency={props.currency}
      dashboardState={props.dashboardState}
      network={props.network}
      onRetry={props.onDashboardRetry}
      overview={props.overview}
      sentiment={props.sentiment}
    />
  );
}
