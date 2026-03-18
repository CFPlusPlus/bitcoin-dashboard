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
        title={`BTC Preisverlauf (${currency.toUpperCase()})`}
        description="Der Chart ist die primaere Explorationsflaeche direkt nach dem Ueberblick und bleibt auch mobil ruhig und gut lesbar."
        meta={<DataStateMeta state={chartState} />}
        action={
          <Cluster role="tablist" aria-label="Zeitraum" gap="sm">
            {[1, 7, 30].map((value) => (
              <Button
                key={value}
                type="button"
                active={range === value}
                intent="secondary"
                size="sm"
                onClick={() => onRangeChange(value as ChartRange)}
              >
                {value === 1 ? "1D" : `${value}D`}
              </Button>
            ))}
          </Cluster>
        }
      />

      <DataState
        state={chartState}
        onRetry={onRetry}
        retryBusy={chartState.isLoading}
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
