import type { AsyncDataState } from "../../lib/data-state";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatCurrency, formatDateTime, formatPercent } from "../../lib/format";
import type { Currency, Overview } from "../../types/dashboard";
import { cn } from "../../lib/cn";
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
  const stateMessages = getDashboardSectionStateMessages("overview", overviewState.error);

  const changeTone =
    typeof change24h === "number" && change24h > 0
      ? "positive"
      : typeof change24h === "number" && change24h < 0
        ? "negative"
        : "default";

  return (
    <Card
      as="section"
      tone="elevated"
      padding="md"
      gap="md"
      className="overflow-hidden"
    >
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
        messages={stateMessages}
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(15rem,0.8fr)]">
          <div className="flex h-full flex-col justify-between gap-4 border border-border-strong bg-muted-surface px-4 py-4">
            <KpiValue
              label={`BTC Preis (${currencyLabel})`}
              value={formatCurrency(price, currency)}
              delta={formatPercent(change24h)}
              meta={`24h-Veraenderung in ${currencyLabel}`}
              size="lg"
              tone={changeTone}
              className="gap-2"
            />

            <div className="grid gap-4 border-t border-border-subtle pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Stack gap="xs" className="max-w-xl">
                <MetaText tone="strong">
                  Die Preiszone bleibt bewusst ruhig und fokussiert, damit Richtung und Niveau
                  sofort lesbar sind.
                </MetaText>
                <MetaText>
                  Marktdaten zuletzt aktualisiert: {formatDateTime(overview?.lastUpdatedAt ?? null)}
                </MetaText>
              </Stack>
              <div className="border border-accent/40 bg-accent-soft px-3 py-2">
                <p className="font-serif text-base leading-none tracking-[-0.03em] text-accent">Spot</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              {
                label: `24h Hoch (${currencyLabel})`,
                text: formatCurrency(high24h, currency),
                meta: "Oberes Ende der aktuellen Tagesspanne.",
                tone: "border-accent/30 bg-accent-soft",
              },
              {
                label: `24h Tief (${currencyLabel})`,
                text: formatCurrency(low24h, currency),
                meta: "Unteres Ende der aktuellen Tagesspanne.",
                tone: "border-border-subtle bg-surface",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn("flex h-full flex-col gap-2 border px-3 py-3", item.tone)}
              >
                <KpiValue label={item.label} value={item.text} size="md" />
                <MetaText>{item.meta}</MetaText>
              </div>
            ))}
          </div>
        </div>
      </DataState>
    </Card>
  );
}
