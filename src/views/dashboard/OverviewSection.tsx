import type { AsyncDataState } from "../../lib/data-state";
import { formatCurrency, formatDateTime, formatPercent } from "../../lib/format";
import type { Currency, Overview } from "../../types/dashboard";
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
  const currencyLabel = currency.toUpperCase();
  const { change24h, high24h, low24h, price } = getOverviewValues(overview, currency);

  const changeTone =
    typeof change24h === "number" && change24h > 0
      ? "positive"
      : typeof change24h === "number" && change24h < 0
        ? "negative"
        : "default";

  return (
    <Card as="section" tone="elevated" padding="lg" gap="lg">
      <SectionHeader
        eyebrow="Primarer Ueberblick"
        title="Bitcoin jetzt"
        description="Die Startseite beginnt mit dem aktuellen BTC-Preis, der Richtung der letzten 24 Stunden und nur so viel Zusatzkontext wie fuer eine schnelle Einordnung noetig ist."
        meta={<DataStateMeta state={overviewState} />}
      />

      <DataState
        state={overviewState}
        onRetry={onRetry}
        retryBusy={overviewState.isLoading}
        messages={{
          loading: {
            title: "Marktdaten werden geladen",
            description: "Preis, 24h-Veraenderung und Handelsspanne werden vorbereitet.",
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
              "Die letzte Aktualisierung ist fehlgeschlagen. Die angezeigten Werte koennen inzwischen veraltet sein.",
          },
        }}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.95fr)]">
          <Card
            as="article"
            tone="muted"
            padding="lg"
            gap="md"
            className="justify-between border-border-strong bg-muted-surface/80"
          >
            <KpiValue
              label={`BTC Preis (${currencyLabel})`}
              value={formatCurrency(price, currency)}
              delta={formatPercent(change24h)}
              meta={`24h-Veraenderung in ${currencyLabel}`}
              size="lg"
              tone={changeTone}
              className="gap-3"
            />

            <Stack gap="xs" className="max-w-xl">
              <MetaText tone="strong">
                Die Preiszone bleibt bewusst ruhig und fokussiert, damit Richtung und Niveau sofort
                lesbar sind.
              </MetaText>
              <MetaText>
                Marktdaten zuletzt aktualisiert: {formatDateTime(overview?.lastUpdatedAt ?? null)}
              </MetaText>
            </Stack>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card as="article" tone="muted" padding="sm" gap="sm" className="h-full">
              <KpiValue
                label={`24h Hoch (${currencyLabel})`}
                value={formatCurrency(high24h, currency)}
                size="md"
              />
              <MetaText>Oberes Ende der aktuellen Tagesspanne.</MetaText>
            </Card>

            <Card as="article" tone="muted" padding="sm" gap="sm" className="h-full">
              <KpiValue
                label={`24h Tief (${currencyLabel})`}
                value={formatCurrency(low24h, currency)}
                size="md"
              />
              <MetaText>Unteres Ende der aktuellen Tagesspanne.</MetaText>
            </Card>
          </div>
        </div>
      </DataState>
    </Card>
  );
}
