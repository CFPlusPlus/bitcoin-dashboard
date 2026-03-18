"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Currency, Overview } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatCurrency } from "../../lib/format";
import { formatMessage } from "../../i18n/template";
import { useI18n } from "../../i18n/context";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import { getOverviewValues } from "./overview-values";

type MarketContextSectionProps = {
  currency: Currency;
  onRetry: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
};

export default function MarketContextSection({
  currency,
  onRetry,
  overview,
  overviewState,
}: MarketContextSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.marketContext;
  const currencyLabel = currency.toUpperCase();
  const { marketCap, volume24h } = getOverviewValues(overview, currency);
  const stateMessages = getDashboardSectionStateMessages("marketContext", overviewState.error, locale);

  return (
    <Card as="section" tone="default" padding="md" className="h-full gap-4 border-border-default/80">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label={formatMessage(copy.marketCapLabel, { currency: currencyLabel })}
            value={formatCurrency(marketCap, currency, locale)}
            meta={copy.marketCapMeta}
            valueFootnote={copy.marketCapFootnote}
          />
          <MetricCard
            label={formatMessage(copy.volumeLabel, { currency: currencyLabel })}
            value={formatCurrency(volume24h, currency, locale)}
            meta={copy.volumeMeta}
            valueFootnote={copy.volumeFootnote}
          />
        </div>
      </DataState>
    </Card>
  );
}
