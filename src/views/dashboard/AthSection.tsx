"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Currency, Overview } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "../../lib/format";
import { useI18n } from "../../i18n/context";
import { formatMessage } from "../../i18n/template";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import KpiValue from "../../components/ui/content/KpiValue";
import MetaText from "../../components/ui/content/MetaText";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import SectionHeader from "../../components/ui/layout/SectionHeader";

type AthSectionProps = {
  currency: Currency;
  onRetry: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
};

function getDaysSinceAth(athDate: string | null, referenceDate: string | null) {
  if (!athDate || !referenceDate) return null;

  const athTimestamp = new Date(athDate).getTime();
  const referenceTimestamp = new Date(referenceDate).getTime();

  if (Number.isNaN(athTimestamp) || Number.isNaN(referenceTimestamp)) {
    return null;
  }

  const days = Math.floor((referenceTimestamp - athTimestamp) / (24 * 60 * 60 * 1000));
  return days >= 0 ? days : null;
}

export default function AthSection({
  currency,
  onRetry,
  overview,
  overviewState,
}: AthSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.ath;
  const stateMessages = getDashboardSectionStateMessages("ath", overviewState.error, locale);
  const ath = overview?.ath ?? null;
  const athDate = overview?.athDate ?? null;
  const athDistance = overview?.athChangePercent ?? null;
  const currentPrice = overview?.price ?? null;
  const gapToAth =
    typeof ath === "number" && typeof currentPrice === "number" ? Math.max(ath - currentPrice, 0) : null;
  const daysSinceAth = getDaysSinceAth(athDate, overview?.fetchedAt ?? null);

  return (
    <Card as="section" tone="default" padding="md" gap="md" className="overflow-hidden">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={formatMessage(copy.description, { currency: currency.toUpperCase() })}
        meta={<DataStateMeta state={overviewState} />}
      />

      <DataState
        state={overviewState}
        onRetry={onRetry}
        retryBusy={overviewState.isLoading}
        messages={stateMessages}
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,1fr))]">
          <div className="flex min-h-[11.5rem] flex-col gap-3 border border-accent/30 bg-[linear-gradient(180deg,rgba(242,143,45,0.08),rgba(255,255,255,0.015))] px-4 py-4">
            <KpiValue
              label={copy.lastAthLabel}
              value={formatCurrency(ath, currency, locale)}
              meta={formatMessage(copy.lastAthMeta, {
                value: formatDate(athDate, locale),
              })}
              size="lg"
            />
            <MetaText tone="strong" className="mt-auto leading-snug">
              {copy.lastAthFootnote}
            </MetaText>
          </div>

          <MetricCard
            label={copy.distanceLabel}
            value={formatPercent(athDistance, locale)}
            meta={copy.distanceMeta}
            valueFootnote={copy.distanceFootnote}
            valueTone={
              typeof athDistance === "number" && athDistance < 0 ? "negative" : "default"
            }
            tone="muted"
          />

          <MetricCard
            label={copy.gapLabel}
            value={formatCurrency(gapToAth, currency, locale)}
            meta={copy.gapMeta}
            valueFootnote={copy.gapFootnote}
            tone="default"
          />

          <MetricCard
            label={copy.daysSinceLabel}
            value={formatMessage(copy.daysSinceValue, {
              value: formatNumber(daysSinceAth, locale),
            })}
            meta={copy.daysSinceMeta}
            valueFootnote={copy.daysSinceFootnote}
            tone="muted"
          />
        </div>
      </DataState>
    </Card>
  );
}
