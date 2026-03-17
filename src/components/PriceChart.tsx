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
  const padding = 24;

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-default bg-app/20 p-6 text-sm text-fg-muted">
        Keine Chartdaten vorhanden.
      </div>
    );
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
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border-subtle bg-app/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.04em] text-fg-muted">Tief</p>
          <p className="mt-2 text-base font-semibold text-fg">{formatCurrency(minPrice, currency)}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-app/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.04em] text-fg-muted">Hoch</p>
          <p className="mt-2 text-base font-semibold text-fg">{formatCurrency(maxPrice, currency)}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-app/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.04em] text-fg-muted">Jetzt</p>
          <p className="mt-2 text-base font-semibold text-fg">
            {formatCurrency(points[points.length - 1].price, currency)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-app/20 p-3 sm:p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label={`Bitcoin-Preischart fuer ${range} Tage in ${currency.toUpperCase()}`}
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
            stroke="rgb(255 255 255 / 10%)"
            strokeWidth="1"
          />

          <path d={areaPath} fill="url(#chartAreaGradient)" />
          <path
            d={linePath}
            fill="none"
            stroke="#f7931a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <text
            x={padding}
            y={height - 2}
            fill="#93a0b8"
            fontSize="14"
            textAnchor="start"
          >
            {formatAxisLabel(points[0].timestamp, range)}
          </text>
          <text
            x={width - padding}
            y={height - 2}
            fill="#93a0b8"
            fontSize="14"
            textAnchor="end"
          >
            {formatAxisLabel(points[points.length - 1].timestamp, range)}
          </text>
        </svg>
      </div>
    </div>
  );
}
