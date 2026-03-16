type Currency = "usd" | "eur";

type ChartPoint = {
  timestamp: number;
  price: number;
};

type PriceChartProps = {
  points: ChartPoint[];
  range: 1 | 7 | 30;
  currency: Currency;
};

function formatAxisLabel(timestamp: number, range: 1 | 7 | 30) {
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

function formatPrice(value: number, currency: Currency) {
  return new Intl.NumberFormat(currency === "usd" ? "en-US" : "de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PriceChart({
  points,
  range,
  currency,
}: PriceChartProps) {
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

  const areaPath = `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(
    2
  )} L ${firstX.toFixed(2)} ${baseY.toFixed(2)} Z`;

  const startLabel = formatAxisLabel(points[0].timestamp, range);
  const endLabel = formatAxisLabel(points[points.length - 1].timestamp, range);

  return (
    <div className="chart-shell">
      <div className="chart-summary">
        <span>Tief: {formatPrice(minPrice, currency)}</span>
        <span>Hoch: {formatPrice(maxPrice, currency)}</span>
        <span>Jetzt: {formatPrice(points[points.length - 1].price, currency)}</span>
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
          {startLabel}
        </text>
        <text
          x={width - padding}
          y={height - 2}
          className="chart-label"
          textAnchor="end"
        >
          {endLabel}
        </text>
      </svg>
    </div>
  );
}