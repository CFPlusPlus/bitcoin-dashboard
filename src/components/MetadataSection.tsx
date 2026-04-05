"use client";

import type { ReactNode } from "react";
import type { AsyncDataState } from "../lib/data-state";
import type { ChartData, Currency, Network, Overview, Sentiment } from "../types/dashboard";
import { getDashboardSectionStateMessages } from "../lib/dashboard-state-copy";
import { formatDateTime } from "../lib/format";
import { formatMessage } from "../i18n/template";
import { useI18n } from "../i18n/context";
import Card from "./ui/Card";
import MetaText from "./ui/content/MetaText";
import DataState from "./ui/data-state/DataState";
import DataStateMeta from "./ui/data-state/DataStateMeta";
import SectionHeader from "./ui/layout/SectionHeader";
import Stack from "./ui/layout/Stack";

type MetadataSectionProps = {
  chart: ChartData | null;
  currency: Currency;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
  network: Network | null;
  onRetry: () => void;
  overview: Overview | null;
  sentiment: Sentiment | null;
};

function MetadataItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack gap="xs">
      <MetaText size="xs">{label}</MetaText>
      <p className="text-sm leading-6 text-fg-secondary">{value}</p>
    </Stack>
  );
}

function MetadataPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-md border border-border-default bg-surface px-4 py-4 sm:px-5 sm:py-5">
      <MetaText size="xs" className="font-mono uppercase tracking-[0.2em]">
        {title}
      </MetaText>
      {children}
    </div>
  );
}

export default function MetadataSection({
  chart,
  currency,
  dashboardState,
  network,
  onRetry,
  overview,
  sentiment,
}: MetadataSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.metadata;
  const stateMessages = getDashboardSectionStateMessages("metadata", dashboardState.error, locale);
  const fallback = messages.common.unavailable;
  const getMetadataValue = (value: string | null | undefined) => value?.trim() || fallback;

  return (
    <Card as="section" tone="muted" gap="lg">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        titleAs="h3"
        titleSize="md"
        description={formatMessage(copy.description, { currency: currency.toUpperCase() })}
        meta={
          <DataStateMeta lastUpdatedLabel={messages.common.lastUpdated} state={dashboardState} />
        }
      />

      <DataState
        state={dashboardState}
        onRetry={onRetry}
        retryBusy={dashboardState.isLoading}
        messages={stateMessages}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]">
          <MetadataPanel title={copy.sourcesTitle}>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetadataItem label={copy.marketSource} value={getMetadataValue(overview?.source)} />
              <MetadataItem label={copy.networkSource} value={getMetadataValue(network?.source)} />
              <MetadataItem
                label={copy.sentimentSource}
                value={getMetadataValue(sentiment?.source)}
              />
              <MetadataItem label={copy.chartSource} value={getMetadataValue(chart?.source)} />
            </div>
          </MetadataPanel>

          <MetadataPanel title={copy.refreshTitle}>
            <div className="grid gap-4">
              <MetadataItem label={copy.activeCurrencyLabel} value={currency.toUpperCase()} />
              <MetadataItem
                label={copy.dashboardUpdated}
                value={formatDateTime(dashboardState.data?.lastRefreshAt ?? null, locale)}
              />
              <MetadataItem
                label={copy.marketUpdated}
                value={formatDateTime(overview?.lastUpdatedAt ?? null, locale)}
              />
              <MetadataItem
                label={copy.networkUpdated}
                value={formatDateTime(network?.fetchedAt ?? null, locale)}
              />
              <MetadataItem
                label={copy.sentimentUpdated}
                value={formatDateTime(sentiment?.fetchedAt ?? null, locale)}
              />
              <MetadataItem
                label={copy.chartUpdated}
                value={formatDateTime(chart?.fetchedAt ?? null, locale)}
              />
            </div>
          </MetadataPanel>
        </div>
      </DataState>
    </Card>
  );
}
