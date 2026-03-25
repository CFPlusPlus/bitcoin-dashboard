"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { AsyncDataState } from "../../lib/data-state";
import type {
  ChartData,
  ChartRange,
  Currency,
  Network,
  Overview,
  Sentiment,
} from "../../types/dashboard";
import { formatMessage } from "../../i18n/template";
import { getLocalizedPathname } from "../../i18n/config";
import { useI18n } from "../../i18n/context";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import {
  formatCompactNumber,
  formatCountdown,
  formatDate,
  formatNumber,
  formatPercentValue,
} from "../../lib/format";
import { getSentimentZoneKey } from "../../lib/sentiment";
import NoticeBar from "../../components/NoticeBar";
import PageHeader from "../../components/PageHeader";
import { buttonVariants } from "../../components/ui/Button";
import Surface from "../../components/ui/Surface";
import MetaText from "../../components/ui/content/MetaText";
import KpiValue from "../../components/ui/content/KpiValue";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import Section from "../../components/ui/layout/Section";
import Stack from "../../components/ui/layout/Stack";
import { cn } from "../../lib/cn";
import ChartSection from "../../components/ChartSection";
import OverviewSection from "./OverviewSection";
import AutoRefreshToggle from "./AutoRefreshToggle";
import RefreshButton from "./RefreshButton";
import RefreshStatus from "./RefreshStatus";

type BitcoinNowSectionProps = {
  autoRefresh: boolean;
  chart: ChartData | null;
  chartState: AsyncDataState<ChartData>;
  currency: Currency;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
  halvingState: AsyncDataState<Network>;
  network: Network | null;
  networkState: AsyncDataState<Network>;
  onAutoRefreshChange: (value: boolean) => void;
  onChartRetry: () => void;
  onNetworkRetry: () => void;
  onOverviewRetry: () => void;
  onRangeChange: (value: ChartRange) => void;
  onRefresh: () => void;
  onSentimentRetry: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
  range: ChartRange;
  refreshing: boolean;
  sentiment: Sentiment | null;
  sentimentState: AsyncDataState<Sentiment>;
  warnings: string[];
};

type SnapshotSurfaceProps = {
  children: ReactNode;
  eyebrow: string;
  meta: ReactNode;
  title: string;
};

function SnapshotSurface({ children, eyebrow, meta, title }: SnapshotSurfaceProps) {
  return (
    <Surface
      as="section"
      tone="elevated"
      padding="md"
      className="flex flex-col gap-4 border-border-default/80 bg-muted-surface/55 xl:min-h-[18.5rem]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle/80 pb-4">
        <div className="min-w-0">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
            {eyebrow}
          </p>
          <p className="mt-2 text-lg font-medium leading-tight text-fg">{title}</p>
        </div>
        <div className="shrink-0">{meta}</div>
      </div>

      {children}
    </Surface>
  );
}

function SnapshotStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-md border border-border-subtle/80 bg-surface px-3 py-3">
      <MetaText size="xs" className="uppercase tracking-[0.16em]">
        {label}
      </MetaText>
      <p className="font-numeric min-w-0 text-sm font-medium text-fg [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function formatFeeValue(value: number | null, locale: "de" | "en", fallback: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  const numberLocale = locale === "de" ? "de-DE" : "en-US";

  return `${new Intl.NumberFormat(numberLocale, {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)} sat/vB`;
}

function formatHashrateValue(value: number | null, locale: "de" | "en", fallback: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  const numberLocale = locale === "de" ? "de-DE" : "en-US";

  return `${new Intl.NumberFormat(numberLocale, {
    maximumFractionDigits: value < 100 ? 1 : 0,
  }).format(value)} EH/s`;
}

function HalvingSnapshotCard({
  halvingState,
  network,
  onRetry,
}: {
  halvingState: AsyncDataState<Network>;
  network: Network | null;
  onRetry: () => void;
}) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.halving;
  const networkCopy = messages.dashboard.network;
  const fallback = messages.common.unavailable;
  const stateMessages = getDashboardSectionStateMessages("halving", halvingState.error, locale);
  const blocksRemaining =
    network?.halving.remainingBlocks === null || network?.halving.remainingBlocks === undefined
      ? fallback
      : `${formatNumber(network.halving.remainingBlocks, locale)} ${copy.blocksSuffix}`;
  const daysRemaining =
    network?.halving.estimatedDaysUntil === null ||
    network?.halving.estimatedDaysUntil === undefined
      ? fallback
      : formatMessage(copy.daysRemainingValue, {
          value: formatNumber(network.halving.estimatedDaysUntil, locale),
        });
  const progress =
    network?.halving.progressPercent === null || network?.halving.progressPercent === undefined
      ? fallback
      : formatMessage(copy.progressValue, {
          value: formatPercentValue(network.halving.progressPercent, locale),
        });

  return (
    <SnapshotSurface
      eyebrow={copy.eyebrow}
      title={copy.title}
      meta={<DataStateMeta state={halvingState} />}
    >
      <DataState
        state={halvingState}
        onRetry={onRetry}
        retryBusy={halvingState.isLoading}
        messages={stateMessages}
      >
        <Stack gap="md">
          <KpiValue label={copy.countdownLabel} value={blocksRemaining} size="lg" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <SnapshotStat
              label={copy.nextHalvingLabel}
              value={formatDate(network?.halving.estimatedDate ?? null, locale)}
            />
            <SnapshotStat
              label={copy.currentBlockLabel}
              value={
                network?.latestBlockHeight === null || network?.latestBlockHeight === undefined
                  ? fallback
                  : `#${formatNumber(network.latestBlockHeight, locale)}`
              }
            />
          </div>
          <div className="rounded-md border border-accent/25 bg-accent-soft px-3 py-3">
            <MetaText size="xs" className="uppercase tracking-[0.16em] text-accent-strong">
              {networkCopy.halvingDaysRemainingLabel}
            </MetaText>
            <p className="mt-2 text-sm leading-6 text-fg-secondary">{daysRemaining}</p>
            <p className="mt-1 text-sm leading-6 text-fg-secondary">{progress}</p>
          </div>
        </Stack>
      </DataState>
    </SnapshotSurface>
  );
}

function SentimentSnapshotCard({
  onRetry,
  sentiment,
  sentimentState,
}: {
  onRetry: () => void;
  sentiment: Sentiment | null;
  sentimentState: AsyncDataState<Sentiment>;
}) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.sentiment;
  const fallback = messages.common.unavailable;
  const zoneKey = getSentimentZoneKey(sentiment?.value ?? null, sentiment?.classification ?? null);
  const zoneCopy = zoneKey ? copy.zones[zoneKey] : copy.zones.unknown;
  const stateMessages = getDashboardSectionStateMessages("sentiment", sentimentState.error, locale);

  return (
    <SnapshotSurface
      eyebrow={copy.eyebrow}
      title={copy.title}
      meta={<DataStateMeta state={sentimentState} />}
    >
      <DataState
        state={sentimentState}
        onRetry={onRetry}
        retryBusy={sentimentState.isLoading}
        messages={stateMessages}
      >
        <Stack gap="md">
          <div className="rounded-md border border-border-subtle/80 bg-surface px-4 py-4">
            <KpiValue
              label={copy.indexLabel}
              value={formatNumber(sentiment?.value ?? null, locale)}
              meta={zoneCopy.label}
              size="lg"
              tone={
                zoneKey === "greed" || zoneKey === "extremeGreed"
                  ? "positive"
                  : zoneKey === "fear" || zoneKey === "extremeFear"
                    ? "negative"
                    : "default"
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <SnapshotStat label={copy.currentZoneLabel} value={zoneCopy.label} />
            <SnapshotStat
              label={copy.nextUpdate}
              value={formatCountdown(sentiment?.timeUntilUpdateSeconds ?? null, locale)}
            />
          </div>
          <p className="text-sm leading-6 text-fg-secondary">
            {sentiment?.attribution ?? fallback}
          </p>
        </Stack>
      </DataState>
    </SnapshotSurface>
  );
}

function NetworkPulseCard({
  network,
  networkState,
  onRetry,
}: {
  network: Network | null;
  networkState: AsyncDataState<Network>;
  onRetry: () => void;
}) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.network;
  const fallback = messages.common.unavailable;
  const stateMessages = getDashboardSectionStateMessages("network", networkState.error, locale);

  return (
    <SnapshotSurface
      eyebrow={copy.eyebrow}
      title={copy.statsCardTitle}
      meta={<DataStateMeta state={networkState} />}
    >
      <DataState
        state={networkState}
        onRetry={onRetry}
        retryBusy={networkState.isLoading}
        messages={stateMessages}
      >
        <Stack gap="md">
          <KpiValue
            label={copy.latestBlock}
            value={
              network?.latestBlockHeight === null || network?.latestBlockHeight === undefined
                ? fallback
                : `#${formatNumber(network.latestBlockHeight, locale)}`
            }
            size="lg"
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <SnapshotStat
              label={copy.priorityFeeLabel}
              value={formatFeeValue(network?.fees.fastestFee ?? null, locale, fallback)}
            />
            <SnapshotStat
              label={copy.pendingTransactionsLabel}
              value={formatCompactNumber(network?.mempool.pendingTransactions ?? null, locale)}
            />
          </div>
          <SnapshotStat
            label={copy.hashrateCurrentLabel}
            value={formatHashrateValue(
              network?.hashrate.currentEhPerSecond ?? null,
              locale,
              fallback
            )}
          />
        </Stack>
      </DataState>
    </SnapshotSurface>
  );
}

export default function BitcoinNowSection({
  autoRefresh,
  chart,
  chartState,
  currency,
  dashboardState,
  halvingState,
  network,
  networkState,
  onAutoRefreshChange,
  onChartRetry,
  onNetworkRetry,
  onOverviewRetry,
  onRangeChange,
  onRefresh,
  onSentimentRetry,
  overview,
  overviewState,
  range,
  refreshing,
  sentiment,
  sentimentState,
  warnings,
}: BitcoinNowSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.home;

  return (
    <Section aria-label={copy.introAriaLabel} space="lg" className="gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_22rem] xl:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <Surface
            as="section"
            tone="elevated"
            padding="lg"
            className="border-border-default/80 xl:px-8 xl:py-7"
          >
            <div className="flex flex-col gap-5">
              <PageHeader />

              <p className="max-w-[41rem] text-[0.98rem] leading-7 text-fg-secondary sm:text-[1.02rem]">
                {copy.heroBody}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="#main-chart-zone"
                  className={cn(buttonVariants({ intent: "primary", size: "md" }), "no-underline")}
                >
                  {copy.jumpToChart}
                </Link>
                <Link
                  href={getLocalizedPathname(locale, "/tools")}
                  className={cn(buttonVariants({ intent: "ghost", size: "md" }), "no-underline")}
                >
                  {copy.jumpToTools}
                </Link>
              </div>

              <div className="grid gap-4 border-t border-border-subtle/80 pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="min-w-0">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
                    {messages.dashboard.controls.statusLabel}
                  </p>
                  <div className="mt-3">
                    <RefreshStatus autoRefresh={autoRefresh} dashboardState={dashboardState} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <AutoRefreshToggle autoRefresh={autoRefresh} onChange={onAutoRefreshChange} />
                  <RefreshButton refreshing={refreshing} onRefresh={onRefresh} />
                </div>
              </div>
            </div>
          </Surface>

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
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-6">
          <HalvingSnapshotCard
            halvingState={halvingState}
            network={network}
            onRetry={onNetworkRetry}
          />
          <SentimentSnapshotCard
            sentiment={sentiment}
            sentimentState={sentimentState}
            onRetry={onSentimentRetry}
          />
          <NetworkPulseCard
            network={network}
            networkState={networkState}
            onRetry={onNetworkRetry}
          />
        </div>
      </div>

      <NoticeBar warnings={warnings} />
    </Section>
  );
}
