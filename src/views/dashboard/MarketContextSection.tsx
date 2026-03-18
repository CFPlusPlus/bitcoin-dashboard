import type { AsyncDataState } from "../../lib/data-state";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
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
  const stateMessages = getDashboardSectionStateMessages("marketContext", overviewState.error);

  return (
    <Card as="section" tone="default" padding="md" className="h-full gap-4 border-border-default/80">
      <SectionHeader
        eyebrow="Marktkontext"
        title="Marktgroesse im Blick"
        description="Market Cap und 24h-Volumen geben dem aktuellen Preis mehr Gewicht, ohne den schnellen Ueberblick zu ueberladen."
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
            label={`Marktkapitalisierung (${currencyLabel})`}
            value={formatCurrency(marketCap, currency)}
            meta="Gesamtwert aller umlaufenden BTC zum aktuellen Marktpreis."
            valueFootnote="Hilft einzuordnen, wie gross Bitcoin im Vergleich zu anderen Maerkten gerade ist."
          />
          <MetricCard
            label={`24h Volumen (${currencyLabel})`}
            value={formatCurrency(volume24h, currency)}
            meta="Geschatztes Handelsvolumen der vergangenen 24 Stunden."
            valueFootnote="Hoeheres Volumen spricht meist fuer mehr Marktaktivitaet und belastbarere Preisbewegungen."
          />
        </div>
      </DataState>
    </Card>
  );
}
