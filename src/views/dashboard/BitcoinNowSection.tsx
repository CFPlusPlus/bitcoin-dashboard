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
import { useI18n } from "../../i18n/context";
import {
  formatCompactNumber,
  formatCurrency,
  formatNumber,
  formatSignedPercentValue,
} from "../../lib/format";
import { getSentimentZoneKey } from "../../lib/sentiment";
import NoticeBar from "../../components/NoticeBar";
import PageHeader from "../../components/PageHeader";
import { buttonVariants } from "../../components/ui/Button";
import Surface from "../../components/ui/Surface";
import Label from "../../components/ui/content/Label";
import MetaText from "../../components/ui/content/MetaText";
import Section from "../../components/ui/layout/Section";
import { cn } from "../../lib/cn";
import ChartSection from "../../components/ChartSection";
import OverviewSection from "./OverviewSection";
import AutoRefreshToggle from "./AutoRefreshToggle";
import RefreshButton from "./RefreshButton";
import RefreshStatus from "./RefreshStatus";
import { getOverviewValues } from "./overview-values";

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

function TodaySignal({
  emphasis = "default",
  isUnavailable = false,
  label,
  meta,
  value,
}: {
  emphasis?: "default" | "primary";
  isUnavailable?: boolean;
  label: string;
  meta: ReactNode;
  value: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-md border px-3 py-3 sm:gap-2.5 sm:px-4 sm:py-4",
        emphasis === "primary" ? "border-accent bg-elevated" : "border-border-default bg-surface"
      )}
    >
      <Label className={cn("mb-0", emphasis === "primary" ? "text-accent" : "text-fg-muted")}>
        {label}
      </Label>
      <div
        className={cn(
          "font-numeric min-w-0 [overflow-wrap:anywhere]",
          emphasis === "primary"
            ? "text-[1.55rem] font-medium leading-[0.94] tracking-[-0.055em] sm:text-[1.95rem]"
            : "text-[1.35rem] font-medium leading-[0.98] tracking-[-0.045em] sm:text-[1.55rem]",
          isUnavailable && "text-[1.1rem] tracking-[-0.03em] text-fg-secondary sm:text-[1.35rem]"
        )}
      >
        {isUnavailable ? "--" : value}
      </div>
      <MetaText
        className={cn("leading-snug", isUnavailable ? "text-fg-muted" : "text-fg-secondary")}
      >
        {meta}
      </MetaText>
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

export default function BitcoinNowSection({
  autoRefresh,
  chart,
  chartState,
  currency,
  dashboardState,
  network,
  onAutoRefreshChange,
  onChartRetry,
  onOverviewRetry,
  onRangeChange,
  onRefresh,
  overview,
  overviewState,
  range,
  refreshing,
  sentiment,
  warnings,
}: BitcoinNowSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.home;
  const athCopy = messages.dashboard.ath;
  const overviewCopy = messages.dashboard.overview;
  const performanceCopy = messages.dashboard.performance;
  const sentimentCopy = messages.dashboard.sentiment;
  const networkCopy = messages.dashboard.network;
  const fallback = messages.common.unavailable;
  const { ath, athChangePercent, price } = getOverviewValues(overview, currency);
  const zoneKey = getSentimentZoneKey(sentiment?.value ?? null, sentiment?.classification ?? null);
  const zoneCopy = zoneKey ? sentimentCopy.zones[zoneKey] : sentimentCopy.zones.unknown;
  const overviewUnavailable = typeof athChangePercent !== "number";
  const sentimentUnavailable = typeof sentiment?.value !== "number";
  const feeValue = network?.fees.halfHourFee ?? null;
  const hashrateValue = network?.hashrate.currentEhPerSecond ?? null;
  const backlogValue = network?.mempool.pendingTransactions ?? null;
  const networkUnavailable =
    !Number.isFinite(feeValue ?? Number.NaN) &&
    !Number.isFinite(hashrateValue ?? Number.NaN) &&
    !Number.isFinite(backlogValue ?? Number.NaN);

  return (
    <Section aria-label={copy.introAriaLabel} space="lg" className="gap-6 xl:gap-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.72fr)_minmax(20rem,0.88fr)] xl:items-stretch">
        <Surface
          as="section"
          tone="elevated"
          padding="lg"
          className="border-border-default xl:px-8 xl:py-7"
        >
          <div className="flex h-full flex-col gap-6 sm:gap-8">
            <PageHeader />

            <div className="mt-auto flex flex-col items-stretch gap-3 sm:items-start">
              <Link
                href="#main-chart-zone"
                className={cn(
                  buttonVariants({ intent: "primary", size: "md" }),
                  "w-full justify-center no-underline sm:w-auto"
                )}
              >
                {copy.jumpToChart}
              </Link>
            </div>
          </div>
        </Surface>

        <Surface
          as="aside"
          tone="elevated"
          padding="lg"
          className="border-border-default xl:px-6 xl:py-6"
        >
          <div className="flex h-full flex-col gap-4 sm:gap-5">
            <div className="flex items-center gap-3 border-b border-border-default pb-3 sm:pb-4">
              <span aria-hidden className="h-px w-8 bg-accent/70" />
              <Label tone="accent">{copy.todayTitle}</Label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <TodaySignal
                emphasis="primary"
                isUnavailable={overviewUnavailable}
                label={performanceCopy.athDistanceLabel}
                value={formatSignedPercentValue(athChangePercent, locale)}
                meta={
                  typeof ath === "number"
                    ? formatMessage(performanceCopy.athPrice, {
                        value: formatCurrency(ath, currency, locale),
                      })
                    : athCopy.distanceMeta
                }
              />
              <TodaySignal
                isUnavailable={sentimentUnavailable}
                label={sentimentCopy.title}
                value={
                  typeof sentiment?.value === "number"
                    ? formatNumber(sentiment.value, locale)
                    : fallback
                }
                meta={sentimentUnavailable ? fallback : zoneCopy.label}
              />
              <TodaySignal
                isUnavailable={networkUnavailable}
                label={networkCopy.title}
                value={formatFeeValue(network?.fees.halfHourFee ?? null, locale, fallback)}
                meta={
                  networkUnavailable
                    ? fallback
                    : formatMessage("{hashrate} / {backlog}", {
                        hashrate: formatHashrateValue(
                          network?.hashrate.currentEhPerSecond ?? null,
                          locale,
                          fallback
                        ),
                        backlog: formatCompactNumber(
                          network?.mempool.pendingTransactions ?? null,
                          locale
                        ),
                      })
                }
              />
            </div>
          </div>
        </Surface>
      </div>

      <NoticeBar warnings={warnings} />

      <Surface
        as="section"
        tone="muted"
        padding="md"
        className="border-border-default/80"
        aria-label={messages.dashboard.controlsAriaLabel}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <Label tone="accent">{messages.dashboard.controls.statusLabel}</Label>
            <div className="mt-3">
              <RefreshStatus autoRefresh={autoRefresh} dashboardState={dashboardState} />
            </div>
          </div>

          <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
            <AutoRefreshToggle
              autoRefresh={autoRefresh}
              size="sm"
              className="w-full justify-center sm:w-auto"
              onChange={onAutoRefreshChange}
            />
            <RefreshButton
              refreshing={refreshing}
              size="sm"
              className="w-full justify-center sm:w-auto"
              onRefresh={onRefresh}
            />
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
    </Section>
  );
}
