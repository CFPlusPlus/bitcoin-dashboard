import type { AsyncDataState } from "../lib/data-state";
import { getDashboardSectionStateMessages } from "../lib/dashboard-state-copy";
import type { ChartData, ChartRange, Currency } from "../types/dashboard";
import PriceChart from "./PriceChart";
import Button from "./ui/Button";
import Card from "./ui/Card";
import DataState from "./ui/data-state/DataState";
import DataStateMeta from "./ui/data-state/DataStateMeta";
import Cluster from "./ui/layout/Cluster";
import SectionHeader from "./ui/layout/SectionHeader";

type ChartSectionProps = {
  chart: ChartData | null;
  chartState: AsyncDataState<ChartData>;
  currency: Currency;
  onRangeChange: (value: ChartRange) => void;
  onRetry: () => void;
  range: ChartRange;
};

const RANGE_OPTIONS: Array<{
  helper: string;
  label: string;
  value: ChartRange;
}> = [
  { value: 1, label: "24H", helper: "Intraday" },
  { value: 7, label: "7T", helper: "Woche" },
  { value: 30, label: "30T", helper: "Monat" },
];

function getRangeDescription(range: ChartRange) {
  if (range === 1) return "die letzten 24 Stunden";
  if (range === 7) return "die letzten 7 Tage";
  return "die letzten 30 Tage";
}

export default function ChartSection({
  chart,
  chartState,
  currency,
  onRangeChange,
  onRetry,
  range,
}: ChartSectionProps) {
  const stateMessages = getDashboardSectionStateMessages("chart", chartState.error);

  return (
    <Card
      as="section"
      id="main-chart-zone"
      tone="elevated"
      padding="md"
      gap="md"
      className="overflow-hidden border-border-default/80"
    >
      <SectionHeader
        eyebrow="Preisverlauf"
        title={`Bitcoin-Chart in ${currency.toUpperCase()}`}
        description={`So hat sich der BTC-Preis für ${getRangeDescription(range)} bewegt.`}
        meta={<DataStateMeta state={chartState} lastUpdatedLabel="Zuletzt erneuert" />}
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
              Zeitraum wählen
            </p>
            <Cluster aria-label="Chart-Zeitraum wählen" gap="sm">
              {RANGE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  active={range === option.value}
                  intent="secondary"
                  size="sm"
                  aria-pressed={range === option.value}
                  title={`${option.label} anzeigen: ${option.helper}`}
                  className="min-w-[4.5rem]"
                  onClick={() => onRangeChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </Cluster>
            <p className="max-w-[32rem] text-sm text-fg-muted sm:text-right">
              Beim Wechsel bleibt der letzte Verlauf sichtbar.
            </p>
          </div>
        }
      />

      <DataState
        state={chartState}
        onRetry={onRetry}
        retryBusy={chartState.isLoading}
        retryLabel="Chart neu laden"
        messages={stateMessages}
      >
        <div className="border border-border-subtle bg-muted-surface p-3 sm:p-4">
          <PriceChart
            points={chart?.points ?? []}
            range={chart?.range ?? range}
            currency={chart?.currency ?? currency}
          />
        </div>
      </DataState>
    </Card>
  );
}
