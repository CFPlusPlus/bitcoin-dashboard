"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Currency, Overview } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatSignedPercentValue,
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
    typeof ath === "number" && typeof currentPrice === "number"
      ? Math.max(ath - currentPrice, 0)
      : null;
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
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)]">
          <div className="flex min-h-[13rem] flex-col gap-4 rounded-md border border-accent bg-surface px-5 py-5">
            <KpiValue
              label={copy.lastAthLabel}
              value={formatCurrency(ath, currency, locale)}
              meta={formatMessage(copy.lastAthMeta, {
                value: formatDate(athDate, locale),
              })}
              size="lg"
              valueClassName="text-[clamp(2.3rem,4vw,3.15rem)] leading-[0.95]"
            />
            <MetaText tone="strong" className="mt-auto max-w-[34ch] leading-snug">
              {copy.lastAthFootnote}
            </MetaText>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-2">
            <MetricCard
              label={copy.distanceLabel}
              value={formatSignedPercentValue(athDistance, locale)}
              meta={copy.distanceMeta}
              valueFootnote={copy.distanceFootnote}
              valueClassName="max-w-full break-words text-[clamp(1.55rem,2.3vw,2rem)] leading-[0.98]"
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

            <div className="sm:col-span-2 xl:col-span-3 2xl:col-span-2">
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
          </div>
        </div>
      </DataState>
    </Card>
  );
}
