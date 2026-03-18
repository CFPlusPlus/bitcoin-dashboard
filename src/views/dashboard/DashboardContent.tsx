"use client";

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
import { useI18n } from "../../i18n/context";
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

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <SentimentSection
            sentiment={props.sentiment}
            sentimentState={props.sentimentState}
            onRetry={props.onSentimentRetry}
          />

          <MarketContextSection
            currency={props.currency}
            overview={props.overview}
            overviewState={props.overviewState}
            onRetry={props.onOverviewRetry}
          />
        </div>
      </Section>

      <NetworkOverviewSection
        network={props.network}
        networkState={props.networkState}
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
