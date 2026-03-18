"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Currency, Overview } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatCurrency, formatDateTime, formatPercent } from "../../lib/format";
import { formatMessage } from "../../i18n/template";
import { useI18n } from "../../i18n/context";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import KpiValue from "../../components/ui/content/KpiValue";
import MetaText from "../../components/ui/content/MetaText";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";
import { getOverviewValues } from "./overview-values";

type OverviewSectionProps = {
  currency: Currency;
  onRetry: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
};

export default function OverviewSection({
  currency,
  onRetry,
  overview,
  overviewState,
}: OverviewSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.overview;
  const currencyLabel = currency.toUpperCase();
  const { change24h, high24h, low24h, price } = getOverviewValues(overview, currency);
  const stateMessages = getDashboardSectionStateMessages("overview", overviewState.error, locale);

  const changeTone =
    typeof change24h === "number" && change24h > 0
      ? "positive"
      : typeof change24h === "number" && change24h < 0
        ? "negative"
        : "default";

  return (
    <Card as="section" tone="elevated" padding="md" gap="md" className="overflow-hidden">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        meta={<DataStateMeta state={overviewState} />}
      />

      <DataState
        state={overviewState}
        onRetry={onRetry}
        retryBusy={overviewState.isLoading}
        messages={stateMessages}
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(15rem,0.8fr)]">
          <div className="flex h-full flex-col justify-between gap-4 border border-border-strong bg-muted-surface px-4 py-4">
            <KpiValue
              label={formatMessage(copy.spotLabel, { currency: currencyLabel })}
              value={formatCurrency(price, currency, locale)}
              delta={formatPercent(change24h, locale)}
              meta={formatMessage(copy.spotMeta, { currency: currencyLabel })}
              size="lg"
              tone={changeTone}
              className="gap-2"
            />

            <div className="grid gap-4 border-t border-border-subtle pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Stack gap="xs" className="max-w-xl">
                <MetaText tone="strong">{copy.lead}</MetaText>
                <MetaText>
                  {formatMessage(copy.providerUpdated, {
                    value: formatDateTime(overview?.lastUpdatedAt ?? null, locale),
                  })}
                </MetaText>
              </Stack>
              <div className="border border-accent/40 bg-accent-soft px-3 py-2">
                <p className="font-serif text-base leading-none tracking-[-0.03em] text-accent">
                  {copy.spotBadge}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              {
                label: formatMessage(copy.highLabel, { currency: currencyLabel }),
                text: formatCurrency(high24h, currency, locale),
                meta: copy.highMeta,
                footnote: copy.highFootnote,
                tone: "default" as const,
              },
              {
                label: formatMessage(copy.lowLabel, { currency: currencyLabel }),
                text: formatCurrency(low24h, currency, locale),
                meta: copy.lowMeta,
                footnote: copy.lowFootnote,
                tone: "muted" as const,
              },
            ].map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.text}
                meta={item.meta}
                valueFootnote={item.footnote}
                tone={item.tone}
              />
            ))}
          </div>
        </div>
      </DataState>
    </Card>
  );
}
