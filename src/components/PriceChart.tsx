import { formatCurrency } from "../lib/format";
import type { ChartPoint, ChartRange, Currency } from "../types/dashboard";

type PriceChartProps = {
  currency: Currency;
  points: ChartPoint[];
  range: ChartRange;
};

function formatAxisLabel(timestamp: number, range: ChartRange) {
  const date = new Date(timestamp);

  if (range === 1) {
    return new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export default function PriceChart({ currency, points, range }: PriceChartProps) {
  const width = 900;
  const height = 280;
  const padding = 20;

  if (points.length === 0) {
    return <div className="chart-empty">Keine Chartdaten vorhanden.</div>;
  }

  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceDelta = maxPrice - minPrice || 1;

  const getX = (index: number) => {
    if (points.length === 1) return width / 2;
    return padding + (index / (points.length - 1)) * (width - padding * 2);
  };

  const getY = (price: number) => {
    const normalized = (price - minPrice) / priceDelta;
    return height - padding - normalized * (height - padding * 2);
  };

  const linePath = points
    .map((point, index) => {
      const x = getX(index);
      const y = getY(point.price);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const firstX = getX(0);
  const lastX = getX(points.length - 1);
  const baseY = height - padding;

  const areaPath = `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(
    2
  )} ${baseY.toFixed(2)} Z`;

  return (
    <div className="chart-shell">
      <div className="chart-summary">
        <span>Tief: {formatCurrency(minPrice, currency)}</span>
        <span>Hoch: {formatCurrency(maxPrice, currency)}</span>
        <span>Jetzt: {formatCurrency(points[points.length - 1].price, currency)}</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        role="img"
        aria-label={`Bitcoin-Preischart für ${range} Tage in ${currency.toUpperCase()}`}
      >
        <defs>
          <linearGradient id="chartAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(247, 147, 26, 0.35)" />
            <stop offset="100%" stopColor="rgba(247, 147, 26, 0.02)" />
          </linearGradient>
        </defs>

        <line
          x1={padding}
          y1={baseY}
          x2={width - padding}
          y2={baseY}
          className="chart-axis"
        />

        <path d={areaPath} fill="url(#chartAreaGradient)" />
        <path d={linePath} className="chart-line" />

        <text x={padding} y={height - 2} className="chart-label" textAnchor="start">
          {formatAxisLabel(points[0].timestamp, range)}
        </text>
        <text
          x={width - padding}
          y={height - 2}
          className="chart-label"
          textAnchor="end"
        >
          {formatAxisLabel(points[points.length - 1].timestamp, range)}
        </text>
      </svg>
    </div>
  );
}
