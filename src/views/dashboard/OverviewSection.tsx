import type { AsyncDataState } from "../../lib/data-state";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatCurrency, formatDateTime, formatPercent } from "../../lib/format";
import type { Currency, Overview } from "../../types/dashboard";
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
        eyebrow="Marktueberblick"
        title="Bitcoin jetzt"
        description="Der aktuelle BTC-Preis und die 24h-Bewegung stehen bewusst zuerst, damit Richtung und Niveau sofort klar sind."
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
              label={`BTC Spotpreis (${currencyLabel})`}
              value={formatCurrency(price, currency)}
              delta={formatPercent(change24h)}
              meta={`24h-Entwicklung zum aktuellen Spotpreis in ${currencyLabel}`}
              size="lg"
              tone={changeTone}
              className="gap-2"
            />

            <div className="grid gap-4 border-t border-border-subtle pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Stack gap="xs" className="max-w-xl">
                <MetaText tone="strong">
                  Die Kernzahlen bleiben knapp gehalten, damit der Blick zuerst bei Preis und Tagesrichtung ankommt.
                </MetaText>
                <MetaText>
                  Marktdaten zuletzt aktualisiert: {formatDateTime(overview?.lastUpdatedAt ?? null)}
                </MetaText>
              </Stack>
              <div className="border border-accent/40 bg-accent-soft px-3 py-2">
                <p className="font-serif text-base leading-none tracking-[-0.03em] text-accent">BTC Spot</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              {
                label: `24h Tageshoch (${currencyLabel})`,
                text: formatCurrency(high24h, currency),
                meta: "Hoechster beobachteter Spotpreis im aktuellen 24h-Fenster.",
                footnote: "Zeigt, wo die aktuelle Handelsspanne nach oben begrenzt wurde.",
                tone: "default" as const,
              },
              {
                label: `24h Tagestief (${currencyLabel})`,
                text: formatCurrency(low24h, currency),
                meta: "Niedrigster beobachteter Spotpreis im aktuellen 24h-Fenster.",
                footnote: "Zeigt, wie weit der Markt innerhalb eines Tages bereits nachgegeben hat.",
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
