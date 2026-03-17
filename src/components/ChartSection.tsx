import AsyncContent from "./AsyncContent";
import PriceChart from "./PriceChart";
import type { ChartData, ChartRange, Currency } from "../types/dashboard";

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
    <article className="card card-wide">
      <div className="chart-header">
        <div>
          <p className="label">BTC Preisverlauf ({currency.toUpperCase()})</p>
          <h2>Chart</h2>
        </div>

        <div className="range-switcher" role="tablist" aria-label="Zeitraum">
          {[1, 7, 30].map((value) => (
            <button
              key={value}
              type="button"
              className={range === value ? "range-btn active" : "range-btn"}
              onClick={() => onRangeChange(value as ChartRange)}
            >
              {value === 1 ? "1D" : `${value}D`}
            </button>
          ))}
        </div>
      </div>

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
        stateClassName="chart-empty"
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
    </article>
  );
}
