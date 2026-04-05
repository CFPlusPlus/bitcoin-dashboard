"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Currency, Performance, PerformanceWindowKey } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatCurrency, formatDate, formatPercent, formatPercentValue } from "../../lib/format";
import { formatMessage } from "../../i18n/template";
import { useI18n } from "../../i18n/context";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import MetaText from "../../components/ui/content/MetaText";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import SectionHeader from "../../components/ui/layout/SectionHeader";

type PerformanceSectionProps = {
  currency: Currency;
  onRetry: () => void;
  performance: Performance | null;
  performanceState: AsyncDataState<Performance>;
};

const RECENT_PERIOD_ORDER: PerformanceWindowKey[] = ["7d", "30d", "90d"];
const LONGER_PERIOD_ORDER: PerformanceWindowKey[] = ["1y", "ytd"];

function getValueTone(value: number | null) {
  if (typeof value !== "number") return "default" as const;
  if (value > 0) return "positive" as const;
  if (value < 0) return "negative" as const;
  return "default" as const;
}

function toIsoDate(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Date(value).toISOString();
}

export default function PerformanceSection({
  currency,
  onRetry,
  performance,
  performanceState,
}: PerformanceSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.performance;
  const stateMessages = getDashboardSectionStateMessages(
    "performance",
    performanceState.error,
    locale
  );
  const periodsByKey = new Map((performance?.periods ?? []).map((period) => [period.key, period]));
  const stats = performance?.stats ?? null;

  function renderPeriodCard(key: PerformanceWindowKey, tone: "default" | "muted" = "muted") {
    const period = periodsByKey.get(key);
    const changePercent = period?.changePercent ?? null;
    const referenceDate =
      typeof period?.referenceTimestamp === "number"
        ? new Date(period.referenceTimestamp).toISOString()
        : null;

    return (
      <MetricCard
        key={key}
        label={copy.periods[key]}
        value={formatPercent(changePercent, locale)}
        meta={formatMessage(copy.referenceDate, {
          value: formatDate(referenceDate, locale),
        })}
        valueFootnote={formatMessage(copy.referencePrice, {
          value: formatCurrency(period?.referencePrice ?? null, currency, locale),
        })}
        valueTone={getValueTone(changePercent)}
        tone={tone}
      />
    );
  }

  return (
    <Card as="section" tone="elevated" padding="md" gap="md" className="overflow-hidden">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={formatMessage(copy.description, { currency: currency.toUpperCase() })}
        meta={<DataStateMeta state={performanceState} />}
      />

      <DataState
        state={performanceState}
        onRetry={onRetry}
        retryBusy={performanceState.isLoading}
        messages={stateMessages}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
          <div className="rounded-md border border-accent bg-muted-surface px-4 py-4 sm:px-5 sm:py-5">
            <MetaText size="xs" className="font-mono uppercase tracking-[0.18em] text-accent">
              {copy.recentTitle}
            </MetaText>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-secondary">
              {copy.recentDescription}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {RECENT_PERIOD_ORDER.map((key) =>
                renderPeriodCard(key, key === "30d" ? "default" : "muted")
              )}
            </div>
          </div>

          <div className="rounded-md border border-border-subtle bg-surface px-4 py-4 sm:px-5 sm:py-5">
            <MetaText size="xs" className="font-mono uppercase tracking-[0.18em]">
              {copy.longerTitle}
            </MetaText>
            <p className="mt-2 max-w-xl text-sm leading-6 text-fg-secondary">
              {copy.longerDescription}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {LONGER_PERIOD_ORDER.map((key) => renderPeriodCard(key, "default"))}
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border-subtle bg-surface px-4 py-4 sm:px-5 sm:py-5">
          <MetaText size="xs" className="mb-3 font-mono uppercase tracking-[0.18em]">
            {copy.structureTitle}
          </MetaText>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            <MetricCard
              label={copy.rangeHighLabel}
              value={formatCurrency(stats?.high52w.price ?? null, currency, locale)}
              meta={formatMessage(copy.rangeHighMeta, {
                value: formatDate(toIsoDate(stats?.high52w.timestamp ?? null), locale),
              })}
              valueFootnote={formatMessage(copy.rangeHighFootnote, {
                value: formatPercent(stats?.distanceFromHigh52wPercent ?? null, locale),
              })}
              valueTone={getValueTone(stats?.distanceFromHigh52wPercent ?? null)}
              tone="default"
            />

            <MetricCard
              label={copy.rangeLowLabel}
              value={formatCurrency(stats?.low52w.price ?? null, currency, locale)}
              meta={formatMessage(copy.rangeLowMeta, {
                value: formatDate(toIsoDate(stats?.low52w.timestamp ?? null), locale),
              })}
              valueFootnote={copy.rangeLowFootnote}
            />

            <MetricCard
              label={copy.movingAverageLabel}
              value={formatCurrency(stats?.movingAverage200d ?? null, currency, locale)}
              meta={copy.movingAverageMeta}
              valueFootnote={formatMessage(copy.movingAverageFootnote, {
                value: formatPercent(stats?.distanceFromMovingAverage200dPercent ?? null, locale),
              })}
              valueTone={getValueTone(stats?.distanceFromMovingAverage200dPercent ?? null)}
              tone="default"
            />

            <MetricCard
              label={copy.volatility30dLabelSafe}
              value={formatPercentValue(stats?.volatility30dPercent ?? null, locale)}
              meta={copy.volatility30dMeta}
              valueFootnote={copy.volatility30dFootnote}
            />

            <MetricCard
              label={copy.volatility90dLabelSafe}
              value={formatPercentValue(stats?.volatility90dPercent ?? null, locale)}
              meta={copy.volatility90dMeta}
              valueFootnote={copy.volatility90dFootnote}
              tone="default"
            />
          </div>
        </div>
      </DataState>
    </Card>
  );
}
