"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Currency, Performance, PerformanceWindowKey } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatCurrency, formatDate, formatPercent } from "../../lib/format";
import { formatMessage } from "../../i18n/template";
import { useI18n } from "../../i18n/context";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import SectionHeader from "../../components/ui/layout/SectionHeader";

type PerformanceSectionProps = {
  currency: Currency;
  onRetry: () => void;
  performance: Performance | null;
  performanceState: AsyncDataState<Performance>;
};

const PERIOD_ORDER: PerformanceWindowKey[] = ["7d", "30d", "1y", "ytd"];

function getValueTone(value: number | null) {
  if (typeof value !== "number") return "default" as const;
  if (value > 0) return "positive" as const;
  if (value < 0) return "negative" as const;
  return "default" as const;
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PERIOD_ORDER.map((key) => {
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
              />
            );
          })}
        </div>
      </DataState>
    </Card>
  );
}
