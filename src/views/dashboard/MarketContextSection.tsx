"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Currency, MarketContextChartData, Overview } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import {
  formatBtc,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercent,
  formatSignedPercentValue,
  formatPercentValue,
} from "../../lib/format";
import { formatMessage } from "../../i18n/template";
import { useI18n } from "../../i18n/context";
import MarketMetricChart from "../../components/MarketMetricChart";
import Card from "../../components/ui/Card";
import KpiValue from "../../components/ui/content/KpiValue";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import MetaText from "../../components/ui/content/MetaText";
import Cluster from "../../components/ui/layout/Cluster";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";
import MetricCard from "../../components/MetricCard";

type MarketContextSectionProps = {
  currency: Currency;
  marketContextChart: MarketContextChartData | null;
  marketContextChartState: AsyncDataState<MarketContextChartData>;
  onRetry: () => void;
  onChartRetry: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
};

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
  const stateMessages = getDashboardSectionStateMessages(
    "marketContext",
    overviewState.error,
    locale
  );
  const btcDominance = overview?.btcDominance ?? null;
  const circulatingSupply = overview?.circulatingSupply ?? null;
  const maxSupply = overview?.maxSupply ?? null;
  const supplyProgressPercent = overview?.supplyProgressPercent ?? null;
  const fullyDilutedValuation = overview?.fullyDilutedValuation ?? null;
  const volumeMarketCapRatio = overview?.volumeMarketCapRatio ?? null;
  const atl = overview?.atl ?? null;
  const atlDate = overview?.atlDate ?? null;
  const atlDistance = overview?.atlChangePercent ?? null;
  const marketCapSeries =
    marketContextChart?.series.find((item) => item.key === "marketCap") ?? null;
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
            description:
              "Marktkapitalisierung und Volumen werden für die letzten 30 Tage vorbereitet.",
          },
          error: {
            title: "30-Tage-Verlauf gerade nicht verfügbar",
            description:
              marketContextChartState.error ??
              "Die historischen Marktkontext-Daten konnten nicht geladen werden.",
          },
          empty: {
            title: "Keine Verlaufsdaten vorhanden",
            description:
              "Für die letzten 30 Tage wurden keine verwertbaren Marktkontext-Daten gefunden.",
          },
        }
      : {
          loading: {
            title: "Loading 30-day history",
            description: "Preparing market cap and volume for the last 30 days.",
          },
          error: {
            title: "30-day history is unavailable right now",
            description:
              marketContextChartState.error ??
              "The historical market context data could not be loaded.",
          },
          empty: {
            title: "No history data available",
            description: "No usable market context history was found for the last 30 days.",
          },
        };

  return (
    <Card
      as="section"
      tone="default"
      padding="md"
      className="h-full gap-4 border-border-default/80"
    >
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
          <div className="grid gap-4 2xl:grid-cols-2">
            {marketCapSeries ? (
              <MarketMetricChart
                currency={currency}
                label={formatMessage(copy.marketCapLabel, { currency: currencyLabel })}
                currentValue={formatCompactCurrency(
                  marketCapSeries.stats.currentValue,
                  currency,
                  locale
                )}
                meta={copy.marketCapFootnote}
                points={marketCapSeries.points}
                tone="accent"
              />
            ) : null}
            {volumeSeries ? (
              <MarketMetricChart
                currency={currency}
                label={formatMessage(copy.volumeLabel, { currency: currencyLabel })}
                currentValue={formatCompactCurrency(
                  volumeSeries.stats.currentValue,
                  currency,
                  locale
                )}
                meta={copy.volumeFootnote}
                points={volumeSeries.points}
              />
            ) : null}
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-[linear-gradient(180deg,rgba(22,19,17,0.98),rgba(15,13,12,0.98))] 2xl:col-span-2">
              <div className="px-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="min-w-0">
                    <Stack gap="sm">
                      <Cluster align="center" gap="sm">
                        <KpiValue
                          label={dominanceCopy.label}
                          value={formatPercentValue(btcDominance, locale)}
                          size="md"
                        />
                        <span className="inline-flex min-h-7 items-center rounded-md bg-elevated px-2.5 text-sm font-semibold text-fg-secondary">
                          {locale === "de" ? "aktuell" : "current"}
                        </span>
                      </Cluster>
                      <MetaText>{dominanceCopy.meta}</MetaText>
                    </Stack>
                  </div>

                  <div className="min-w-0 border-t border-white/8 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                    <KpiValue
                      label={copy.supplyLabel}
                      value={formatBtc(circulatingSupply, locale)}
                      meta={copy.supplyMeta}
                      size="md"
                      valueClassName="max-w-full break-words text-[clamp(1.9rem,3.5vw,2.5rem)] leading-[0.94]"
                    />
                    <MetaText tone="strong" size="xs" className="mt-2 leading-snug">
                      {formatMessage(copy.supplyCap, {
                        value: formatBtc(maxSupply, locale),
                      })}
                    </MetaText>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-500"
                        style={{
                          width: `${Math.max(0, Math.min(100, supplyProgressPercent ?? 0))}%`,
                        }}
                      />
                    </div>
                    <MetaText className="mt-2">
                      {formatMessage(copy.supplyProgress, {
                        value: formatPercentValue(supplyProgressPercent, locale),
                      })}
                    </MetaText>
                  </div>

                  <div className="min-w-0 border-t border-white/8 pt-4 md:col-span-2 md:pl-0">
                    <KpiValue
                      label={copy.fdvLabel}
                      value={formatCompactCurrency(fullyDilutedValuation, currency, locale)}
                      meta={copy.fdvMeta}
                      size="md"
                      valueClassName="max-w-full break-words text-[clamp(1.85rem,3.2vw,2.35rem)] leading-[0.94]"
                    />
                    <MetaText tone="strong" size="xs" className="leading-snug">
                      {copy.fdvFootnote}
                    </MetaText>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 2xl:col-span-2">
              <MetricCard
                label={copy.atlLabel}
                value={formatCurrency(atl, currency, locale)}
                meta={formatMessage(copy.atlMeta, {
                  value: formatDate(atlDate, locale),
                })}
                valueFootnote={copy.atlFootnote}
              />
              <MetricCard
                label={copy.atlDistanceLabel}
                value={formatSignedPercentValue(atlDistance, locale)}
                meta={copy.atlDistanceMeta}
                valueFootnote={copy.atlDistanceFootnote}
                valueClassName="max-w-full break-words text-[clamp(1.45rem,2.6vw,1.85rem)] leading-[0.98]"
                valueTone={
                  typeof atlDistance === "number" && atlDistance > 0 ? "positive" : "default"
                }
                tone="default"
              />
              <MetricCard
                tone="default"
                label={copy.volumeMarketCapRatioLabel}
                value={formatPercentValue(
                  volumeMarketCapRatio !== null ? volumeMarketCapRatio * 100 : null,
                  locale
                )}
                meta={copy.volumeMarketCapRatioMeta}
                valueFootnote={copy.volumeMarketCapRatioFootnote}
                valueClassName="max-w-full break-words text-[clamp(1.55rem,2.8vw,1.95rem)] leading-[0.98] sm:text-[clamp(1.7rem,2.7vw,2.05rem)]"
              />
            </div>
          </div>
        </DataState>
      </DataState>
    </Card>
  );
}
