import PriceChart from "./PriceChart";
import type { ChartData, ChartRange, Currency } from "../types/dashboard";

type ChartSectionProps = {
  chart: ChartData | null;
  chartError: string;
  chartLoading: boolean;
  currency: Currency;
  range: ChartRange;
  showChartSkeleton: boolean;
  onRangeChange: (value: ChartRange) => void;
};

export default function ChartSection({
  chart,
  chartError,
  chartLoading,
  currency,
  range,
  showChartSkeleton,
  onRangeChange,
}: ChartSectionProps) {
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

      {chartError && <div className="chart-empty">Fehler: {chartError}</div>}
      {showChartSkeleton && <div className="chart-empty">Lade Chartdaten...</div>}
      {!chartError && !chartLoading && chart && (
        <PriceChart points={chart.points} range={chart.range} currency={chart.currency} />
      )}
    </article>
  );
}
