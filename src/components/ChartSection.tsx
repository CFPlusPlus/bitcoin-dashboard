import type { ChartData, ChartRange, Currency } from "../types/dashboard";
import AsyncContent from "./AsyncContent";
import PriceChart from "./PriceChart";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Cluster from "./ui/layout/Cluster";
import SectionHeader from "./ui/layout/SectionHeader";

type ChartSectionProps = {
  chart: ChartData | null;
  chartError: string;
  chartLoading: boolean;
  currency: Currency;
  range: ChartRange;
  showChartSkeleton: boolean;
  onRetry: () => void;
  onRangeChange: (value: ChartRange) => void;
};

export default function ChartSection({
  chart,
  chartError,
  chartLoading,
  currency,
  range,
  showChartSkeleton,
  onRetry,
  onRangeChange,
}: ChartSectionProps) {
  const hasChart = chart !== null && chart.points.length > 0;
  const hasStoredChart = chart !== null;
  const isEmpty = chart !== null && chart.points.length === 0;

  return (
    <Card as="section" className="gap-5">
      <SectionHeader
        eyebrow="Preisverlauf"
        title={`BTC Preisverlauf (${currency.toUpperCase()})`}
        description="Vergleiche die kurzfristige Entwicklung ueber einen kleinen, wiederverwendbaren Chart-Block."
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

      <AsyncContent
        emptyMessage="Fur den ausgewahlten Zeitraum sind aktuell keine Chartpunkte verfugbar."
        emptyTitle="Keine Chartdaten"
        error={chartError}
        hasContent={hasChart}
        isEmpty={isEmpty}
        loading={showChartSkeleton || chartLoading}
        loadingMessage="Chartpunkte fur den gewahlten Zeitraum werden geladen."
        loadingTitle="Chart wird geladen"
        onAction={onRetry}
        preserveContentOnError={hasStoredChart}
        stateClassName="mt-1"
        unavailableMessage={
          hasStoredChart
            ? "Letzte Chartdaten werden angezeigt. Neue Werte sind gerade nicht verfugbar."
            : chartError
        }
        unavailableTitle="Chart vorubergehend nicht verfugbar"
      >
        <PriceChart
          points={chart?.points ?? []}
          range={chart?.range ?? range}
          currency={chart?.currency ?? currency}
        />
      </AsyncContent>
    </Card>
  );
}
