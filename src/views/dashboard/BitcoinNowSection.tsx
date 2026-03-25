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

function TodaySignal({ label, meta, value }: { label: string; meta: ReactNode; value: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-md border border-border-subtle/85 bg-surface px-4 py-4">
      <MetaText size="xs" className="font-mono uppercase tracking-[0.18em] text-fg-muted">
        {label}
      </MetaText>
      <div className="font-numeric min-w-0 text-[1.8rem] font-medium leading-[0.96] tracking-[-0.05em] text-fg [overflow-wrap:anywhere]">
        {value}
      </div>
      <MetaText className="leading-snug text-fg-secondary">{meta}</MetaText>
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

  return (
    <Section aria-label={copy.introAriaLabel} space="lg" className="gap-6 xl:gap-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.62fr)_minmax(20rem,0.92fr)] xl:items-stretch">
        <Surface
          as="section"
          tone="elevated"
          padding="lg"
          className="border-border-default/80 xl:px-8 xl:py-7"
        >
          <div className="flex h-full flex-col gap-6">
            <PageHeader />

            <p className="max-w-[42rem] text-[0.98rem] leading-7 text-fg-secondary sm:text-[1.02rem]">
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

            <div className="mt-auto grid gap-4 border-t border-border-subtle/80 pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
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

        <Surface
          as="aside"
          tone="elevated"
          padding="lg"
          className="border-border-default/80 xl:px-6 xl:py-6"
        >
          <div className="flex h-full flex-col gap-5">
            <div className="border-b border-border-subtle/80 pb-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
                {copy.todayTitle}
              </p>
              <p className="mt-3 text-sm leading-6 text-fg-secondary">{copy.todayDescription}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
              <TodaySignal
                label={overviewCopy.title}
                value={formatCurrency(price, currency, locale)}
                meta={
                  typeof change24h === "number"
                    ? `${formatPercent(change24h, locale)} ${overviewCopy.liveDeltaLabel}`
                    : fallback
                }
              />
              <TodaySignal
                label={sentimentCopy.title}
                value={
                  typeof sentiment?.value === "number"
                    ? formatNumber(sentiment.value, locale)
                    : fallback
                }
                meta={zoneCopy.label}
              />
              <TodaySignal
                label={networkCopy.title}
                value={formatFeeValue(network?.fees.halfHourFee ?? null, locale, fallback)}
                meta={formatMessage("{hashrate} · {backlog}", {
                  hashrate: formatHashrateValue(
                    network?.hashrate.currentEhPerSecond ?? null,
                    locale,
                    fallback
                  ),
                  backlog: formatCompactNumber(
                    network?.mempool.pendingTransactions ?? null,
                    locale
                  ),
                })}
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
