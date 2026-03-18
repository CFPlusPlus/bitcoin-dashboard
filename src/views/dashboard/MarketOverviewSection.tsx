import type { AsyncDataState } from "../../lib/data-state";
import { formatCurrency, formatPercent } from "../../lib/format";
import type { Currency, Overview } from "../../types/dashboard";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import MetaText from "../../components/ui/content/MetaText";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";

type MarketOverviewSectionProps = {
  currency: Currency;
  onRetry: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
};

export default function MarketOverviewSection({
  currency,
  onRetry,
  overview,
  overviewState,
}: MarketOverviewSectionProps) {
  const currencyLabel = currency.toUpperCase();
  const selectedPrice = currency === "usd" ? overview?.priceUsd ?? null : overview?.priceEur ?? null;
  const selectedChange24h =
    currency === "usd" ? overview?.change24hUsd ?? null : overview?.change24hEur ?? null;
  const selectedVolume24h =
    currency === "usd" ? overview?.volume24hUsd ?? null : overview?.volume24hEur ?? null;
  const selectedMarketCap =
    currency === "usd" ? overview?.marketCapUsd ?? null : overview?.marketCapEur ?? null;
  const selectedHigh24h =
    currency === "usd" ? overview?.high24hUsd ?? null : overview?.high24hEur ?? null;
  const selectedLow24h =
    currency === "usd" ? overview?.low24hUsd ?? null : overview?.low24hEur ?? null;

  const changeTone =
    typeof selectedChange24h === "number" && selectedChange24h > 0
      ? "positive"
      : typeof selectedChange24h === "number" && selectedChange24h < 0
        ? "negative"
        : "default";

  return (
    <Card as="section" className="gap-5">
      <SectionHeader
        eyebrow="Marktueberblick"
        title="Live-Marktuebersicht"
        description="Preis, Veraenderung, Liquiditaet und Spanne in einem wiederverwendbaren KPI-Block."
        meta={<DataStateMeta state={overviewState} />}
      />

      <DataState
        state={overviewState}
        onRetry={onRetry}
        retryBusy={overviewState.isLoading}
        messages={{
          loading: {
            title: "Marktdaten werden geladen",
            description: "Preis, Volumen und Market Cap werden vorbereitet.",
          },
          empty: {
            title: "Keine Marktdaten verfuegbar",
            description:
              "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren Marktdaten.",
          },
          error: {
            title: "Marktdaten sind gerade nicht verfuegbar",
            description:
              overviewState.error ??
              "Es konnten noch keine verlaesslichen Marktdaten geladen werden.",
          },
          partial: {
            title: "Marktdaten sind teilweise verfuegbar",
            description:
              "Einzelne Kennzahlen fehlen im aktuellen Abruf. Verfuegbare Werte bleiben sichtbar.",
          },
          stale: {
            title: "Letzte Marktdaten bleiben sichtbar",
            description:
              "Die letzte Aktualisierung ist fehlgeschlagen. Die angezeigten Werte koennen inzwischen ueberholt sein.",
          },
        }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label={`BTC Preis (${currencyLabel})`}
            value={formatCurrency(selectedPrice, currency)}
          />

          <MetricCard
            label={`24h Anderung (${currencyLabel})`}
            value={formatPercent(selectedChange24h)}
            valueTone={changeTone}
          />

          <MetricCard
            label={`24h Volumen (${currencyLabel})`}
            value={formatCurrency(selectedVolume24h, currency)}
          />

          <MetricCard
            label={`Market Cap (${currencyLabel})`}
            value={formatCurrency(selectedMarketCap, currency)}
          />

          <Card as="article" tone="muted" padding="sm" gap="sm">
            <MetaText className="uppercase tracking-[0.04em]" size="xs">
              24h High / Low ({currencyLabel})
            </MetaText>
            <Stack gap="sm">
              <div className="flex items-center justify-between gap-3">
                <MetaText>High</MetaText>
                <p className="text-base font-semibold text-fg">
                  {formatCurrency(selectedHigh24h, currency)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <MetaText>Low</MetaText>
                <p className="text-base font-semibold text-fg">
                  {formatCurrency(selectedLow24h, currency)}
                </p>
              </div>
            </Stack>
          </Card>
        </div>
      </DataState>
    </Card>
  );
}
