import type { AsyncDataState } from "../../lib/data-state";
import { formatCurrency } from "../../lib/format";
import type { Currency, Overview } from "../../types/dashboard";
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
  const currencyLabel = currency.toUpperCase();
  const { marketCap, volume24h } = getOverviewValues(overview, currency);

  return (
    <Card as="section" tone="default" className="h-full gap-5">
      <SectionHeader
        eyebrow="Marktkontext"
        title="Groessere Marktgroesse"
        description="Market Cap und 24h-Volumen ordnen den aktuellen Preis ein, bleiben aber klar nach dem Ueberblick und dem Chart."
        meta={<DataStateMeta state={overviewState} />}
      />

      <DataState
        state={overviewState}
        onRetry={onRetry}
        retryBusy={overviewState.isLoading}
        messages={{
          loading: {
            title: "Marktkontext wird geladen",
            description: "Market Cap und Handelsvolumen werden vorbereitet.",
          },
          empty: {
            title: "Kein Marktkontext verfuegbar",
            description:
              "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren Marktmetriken.",
          },
          error: {
            title: "Marktkontext ist gerade nicht verfuegbar",
            description:
              overviewState.error ??
              "Es konnten noch keine verlaesslichen Marktmetriken geladen werden.",
          },
          partial: {
            title: "Marktkontext ist teilweise verfuegbar",
            description:
              "Einzelne Metriken fehlen im aktuellen Abruf. Verfuegbare Werte bleiben sichtbar.",
          },
          stale: {
            title: "Letzter Marktkontext bleibt sichtbar",
            description:
              "Die Aktualisierung ist fehlgeschlagen. Die angezeigten Kennzahlen koennen inzwischen veraltet sein.",
          },
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label={`Market Cap (${currencyLabel})`}
            value={formatCurrency(marketCap, currency)}
          />
          <MetricCard
            label={`24h Volumen (${currencyLabel})`}
            value={formatCurrency(volume24h, currency)}
          />
        </div>
      </DataState>
    </Card>
  );
}
