"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Currency, MarketContextChartData, Overview } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatCurrency, formatPercentValue } from "../../lib/format";
import { formatMessage } from "../../i18n/template";
import { useI18n } from "../../i18n/context";
import MarketMetricChart from "../../components/MarketMetricChart";
import Card from "../../components/ui/Card";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import MetaText from "../../components/ui/content/MetaText";
import SectionHeader from "../../components/ui/layout/SectionHeader";

type MarketContextSectionProps = {
  currency: Currency;
  marketContextChart: MarketContextChartData | null;
  marketContextChartState: AsyncDataState<MarketContextChartData>;
  onRetry: () => void;
  onChartRetry: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
};

function formatCompactCurrency(value: number | null, currency: Currency, locale: "de" | "en") {
  if (value === null || !Number.isFinite(value)) {
    return locale === "de" ? "k. A." : "N/A";
  }

  return new Intl.NumberFormat(locale === "de" ? (currency === "eur" ? "de-DE" : "en-US") : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function MarketContextSection({
  currency,
  marketContextChart,
  marketContextChartState,
  onRetry,
  onChartRetry,
  overview,
  overviewState,
}: MarketContextSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.marketContext;
  const currencyLabel = currency.toUpperCase();
  const stateMessages = getDashboardSectionStateMessages("marketContext", overviewState.error, locale);
  const btcDominance = overview?.btcDominance ?? null;
  const marketCapSeries = marketContextChart?.series.find((item) => item.key === "marketCap") ?? null;
  const volumeSeries = marketContextChart?.series.find((item) => item.key === "volume24h") ?? null;
  const dominanceCopy =
    locale === "de"
      ? {
          label: "Bitcoin-Dominanz",
          meta: "Aktueller Anteil von Bitcoin an der gesamten Krypto-Marktkapitalisierung.",
        }
      : {
          label: "Bitcoin dominance",
          meta: "Current share of Bitcoin across the total crypto market capitalization.",
        };
  const chartMessages =
    locale === "de"
      ? {
          loading: {
            title: "30-Tage-Verlauf wird geladen",
            description: "Marktkapitalisierung und Volumen werden für die letzten 30 Tage vorbereitet.",
          },
          error: {
            title: "30-Tage-Verlauf gerade nicht verfügbar",
            description: marketContextChartState.error ?? "Die historischen Marktkontext-Daten konnten nicht geladen werden.",
          },
          empty: {
            title: "Keine Verlaufsdaten vorhanden",
            description: "Für die letzten 30 Tage wurden keine verwertbaren Marktkontext-Daten gefunden.",
          },
        }
      : {
          loading: {
            title: "Loading 30-day history",
            description: "Preparing market cap and volume for the last 30 days.",
          },
          error: {
            title: "30-day history is unavailable right now",
            description: marketContextChartState.error ?? "The historical market context data could not be loaded.",
          },
          empty: {
            title: "No history data available",
            description: "No usable market context history was found for the last 30 days.",
          },
        };

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-4">
          <MetaText tone="strong">
            {locale === "de" ? "30-Tage-Verlauf" : "30-day history"}
          </MetaText>
          <MetaText>
            {locale === "de"
              ? "Marktkapitalisierung und Volumen im zeitlichen Verlauf."
              : "Market cap and volume over time."}
          </MetaText>
        </div>

        <DataState
          state={marketContextChartState}
          onRetry={onChartRetry}
          retryBusy={marketContextChartState.isLoading}
          messages={chartMessages}
        >
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {marketCapSeries ? (
              <MarketMetricChart
                label={formatMessage(copy.marketCapLabel, { currency: currencyLabel })}
                currentValue={formatCompactCurrency(marketCapSeries.stats.currentValue, currency, locale)}
                points={marketCapSeries.points}
                tone="accent"
              />
            ) : null}
            {volumeSeries ? (
              <MarketMetricChart
                label={formatMessage(copy.volumeLabel, { currency: currencyLabel })}
                currentValue={formatCompactCurrency(volumeSeries.stats.currentValue, currency, locale)}
                points={volumeSeries.points}
              />
            ) : null}
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-[linear-gradient(180deg,rgba(22,19,17,0.98),rgba(15,13,12,0.98))]">
              <div className="px-4 py-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">{dominanceCopy.label}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="font-mono text-[1.75rem] leading-none tracking-[-0.05em] text-fg sm:text-[1.95rem]">
                    {formatPercentValue(btcDominance, locale)}
                  </p>
                  <span className="inline-flex min-h-7 items-center rounded-md bg-elevated px-2.5 text-sm font-semibold text-fg-secondary">
                    {locale === "de" ? "aktuell" : "current"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-fg-muted">{dominanceCopy.meta}</p>
              </div>
              <div className="px-2 pb-2">
                <div className="h-[70px] rounded-lg border border-white/4 bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0.01))]" />
              </div>
            </div>
          </div>
        </DataState>
      </DataState>
    </Card>
  );
}
