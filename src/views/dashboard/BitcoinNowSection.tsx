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
import { formatCompactNumber, formatCurrency, formatNumber, formatPercent } from "../../lib/format";
import { getSentimentZoneKey } from "../../lib/sentiment";
import NoticeBar from "../../components/NoticeBar";
import PageHeader from "../../components/PageHeader";
import { buttonVariants } from "../../components/ui/Button";
import Surface from "../../components/ui/Surface";
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
        "flex min-w-0 flex-col gap-2.5 rounded-md border px-3.5 py-3.5 sm:gap-3 sm:px-4 sm:py-4",
        emphasis === "primary"
          ? "border-accent/28 bg-surface"
          : "border-border-subtle/85 bg-surface/90"
      )}
      style={
        emphasis === "primary"
          ? {
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--token-color-accent-primary) 8%, transparent), transparent 70%), var(--token-color-bg-surface)",
            }
          : undefined
      }
    >
      <MetaText
        size="xs"
        className={cn(
          "font-mono uppercase tracking-[0.18em]",
          emphasis === "primary" ? "text-accent" : "text-fg-muted"
        )}
      >
        {label}
      </MetaText>
      <div
        className={cn(
          "font-numeric min-w-0 [overflow-wrap:anywhere]",
          emphasis === "primary"
            ? "text-[1.72rem] font-medium leading-[0.94] tracking-[-0.06em] sm:text-[2.2rem]"
            : "text-[1.5rem] font-medium leading-[0.98] tracking-[-0.05em] sm:text-[1.7rem]",
          isUnavailable && "text-[1.2rem] tracking-[-0.03em] text-fg-secondary sm:text-[1.55rem]"
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
  const overviewCopy = messages.dashboard.overview;
  const sentimentCopy = messages.dashboard.sentiment;
  const networkCopy = messages.dashboard.network;
  const fallback = messages.common.unavailable;
  const { change24h, price } = getOverviewValues(overview, currency);
  const zoneKey = getSentimentZoneKey(sentiment?.value ?? null, sentiment?.classification ?? null);
  const zoneCopy = zoneKey ? sentimentCopy.zones[zoneKey] : sentimentCopy.zones.unknown;
  const overviewUnavailable = typeof price !== "number";
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.62fr)_minmax(20rem,0.92fr)] xl:items-stretch">
        <Surface
          as="section"
          tone="elevated"
          padding="lg"
          className="border-border-default/80 xl:px-8 xl:py-7"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--token-color-text-primary) 1.6%, transparent), transparent 22%), linear-gradient(132deg, color-mix(in srgb, var(--token-color-accent-primary) 5%, transparent), transparent 38%), linear-gradient(180deg, color-mix(in srgb, var(--token-color-bg-elevated) 96%, transparent), color-mix(in srgb, var(--token-color-bg-surface) 92%, transparent))",
          }}
        >
          <div className="flex h-full flex-col gap-4 sm:gap-6">
            <PageHeader />

            <p className="hidden max-w-[39rem] text-[0.98rem] leading-7 text-fg-secondary sm:block sm:text-[1.02rem]">
              {copy.heroBody}
            </p>

            <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Link
                href="#main-chart-zone"
                className={cn(
                  buttonVariants({ intent: "primary", size: "md" }),
                  "w-full justify-center no-underline sm:w-auto"
                )}
              >
                {copy.jumpToChart}
              </Link>
              <Link
                href={getLocalizedPathname(locale, "/tools")}
                className={cn(
                  "inline-flex min-h-9 items-center justify-center px-2 text-[0.69rem] font-medium uppercase tracking-[0.2em] text-fg-secondary no-underline transition-[color,opacity] duration-[var(--motion-fast)] ease-[var(--ease-standard)] hover:text-fg sm:min-h-10 sm:rounded-md sm:border sm:border-transparent sm:px-4 sm:hover:border-border-subtle sm:hover:bg-elevated/70"
                )}
              >
                {copy.jumpToTools}
              </Link>
            </div>

            <div className="mt-auto grid gap-3 border-t border-border-subtle/80 pt-4 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="min-w-0 rounded-md border border-border-subtle/75 bg-app/30 px-4 py-3">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
                  {messages.dashboard.controls.statusLabel}
                </p>
                <div className="mt-3">
                  <RefreshStatus autoRefresh={autoRefresh} dashboardState={dashboardState} />
                </div>
              </div>

              <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
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
          </div>
        </Surface>

        <Surface
          as="aside"
          tone="elevated"
          padding="lg"
          className="border-border-default/80 xl:px-6 xl:py-6"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--token-color-text-primary) 1.4%, transparent), transparent 18%), linear-gradient(180deg, color-mix(in srgb, var(--token-color-bg-elevated) 96%, transparent), color-mix(in srgb, var(--token-color-bg-surface) 92%, transparent))",
          }}
        >
          <div className="flex h-full flex-col gap-4 sm:gap-5">
            <div className="border-b border-border-subtle/80 pb-3.5 sm:pb-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
                {copy.todayTitle}
              </p>
              <p className="mt-2 hidden text-sm leading-6 text-fg-secondary sm:block">
                {copy.todayDescription}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1.18fr)_repeat(2,minmax(0,0.9fr))] xl:grid-cols-1">
              <TodaySignal
                emphasis="primary"
                isUnavailable={overviewUnavailable}
                label={overviewCopy.title}
                value={formatCurrency(price, currency, locale)}
                meta={
                  typeof change24h === "number"
                    ? `${formatPercent(change24h, locale)} ${overviewCopy.liveDeltaLabel}`
                    : fallback
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
