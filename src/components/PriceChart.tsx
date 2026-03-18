import { formatCurrency, formatPercent } from "../lib/format";
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

function formatCoverageLabel(timestamp: number, range: ChartRange) {
  const date = new Date(timestamp);

  return new Intl.DateTimeFormat(
    "de-DE",
    range === 1
      ? {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }
      : {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
  ).format(date);
}

function getRangeLabel(range: ChartRange) {
  if (range === 1) return "letzten 24 Stunden";
  if (range === 7) return "letzten 7 Tage";
  return "letzten 30 Tage";
}

export default function PriceChart({ currency, points, range }: PriceChartProps) {
  const width = 900;
  const height = 300;
  const paddingX = 52;
  const paddingY = 24;

  if (points.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border-default bg-surface p-5 text-sm text-fg-muted">
        Keine Chartdaten vorhanden.
      </div>
    );
  }

  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceDelta = maxPrice - minPrice || 1;
  const firstPoint = points[0];
  const latestPoint = points[points.length - 1];
  const middlePoint = points[Math.floor((points.length - 1) / 2)];
  const currentPrice = latestPoint.price;
  const absoluteChange = latestPoint.price - firstPoint.price;
  const relativeChange = firstPoint.price === 0 ? null : (absoluteChange / firstPoint.price) * 100;
  const midpointPrice = minPrice + priceDelta / 2;
  const changeTone =
    absoluteChange > 0 ? "text-success" : absoluteChange < 0 ? "text-danger" : "text-fg";

  const getX = (index: number) => {
    if (points.length === 1) return width / 2;
    return paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
  };

  const getY = (price: number) => {
    const normalized = (price - minPrice) / priceDelta;
    return height - paddingY - normalized * (height - paddingY * 2);
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
  const lastY = getY(latestPoint.price);
  const baseY = height - paddingY;

  const areaPath = `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(
    2
  )} ${baseY.toFixed(2)} Z`;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="border border-accent/30 bg-accent-soft px-3 py-3">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
            Chart-Kontext
          </p>
          <p className="mt-2 text-sm font-medium text-fg">
            Bitcoin in {currency.toUpperCase()} ueber die {getRangeLabel(range)}
          </p>
          <p className="mt-2 text-sm leading-6 text-fg-muted">
            Die Linie zeigt den Preisverlauf von {formatCoverageLabel(firstPoint.timestamp, range)}{" "}
            bis {formatCoverageLabel(latestPoint.timestamp, range)}.
          </p>
        </div>

        <div className="border border-border-subtle bg-surface px-3 py-2.5">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
            Tief im Fenster
          </p>
          <p className="mt-2 font-mono text-base text-fg">{formatCurrency(minPrice, currency)}</p>
        </div>

        <div className="border border-border-subtle bg-surface px-3 py-2.5">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
            Hoch im Fenster
          </p>
          <p className="mt-2 font-mono text-base text-fg">{formatCurrency(maxPrice, currency)}</p>
        </div>

        <div className="border border-accent/35 bg-accent-soft px-3 py-2.5">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">Zuletzt</p>
          <p className="mt-2 font-mono text-base text-fg">{formatCurrency(currentPrice, currency)}</p>
          <p className={`mt-2 text-sm font-medium ${changeTone}`}>
            {formatCurrency(absoluteChange, currency)} ({formatPercent(relativeChange)})
          </p>
        </div>
      </div>

      <div className="overflow-hidden border border-border-subtle bg-surface p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-2 border-b border-border-subtle/80 pb-3 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Leserichtung: links aelter, rechts aktueller. Der markierte Punkt zeigt den letzten
            Kurs im gewaelten Bereich.
          </p>
          <p className="font-medium text-fg-secondary">
            Zeitfenster: {formatAxisLabel(firstPoint.timestamp, range)} bis{" "}
            {formatAxisLabel(latestPoint.timestamp, range)}
          </p>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label={`Bitcoin-Preischart fuer ${range} Tage in ${currency.toUpperCase()}`}
        >
          <line
            x1={paddingX}
            y1={baseY}
            x2={width - paddingX}
            y2={baseY}
            stroke="rgb(255 245 232 / 0.1)"
            strokeWidth="1"
          />

          {[
            { label: formatCurrency(maxPrice, currency), value: maxPrice, dashed: true },
            { label: formatCurrency(midpointPrice, currency), value: midpointPrice, dashed: true },
            { label: formatCurrency(minPrice, currency), value: minPrice, dashed: false },
          ].map((item) => {
            const y = getY(item.value);

            return (
              <g key={`${item.label}-${item.value}`}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgb(255 245 232 / 0.05)"
                  strokeDasharray={item.dashed ? "6 10" : undefined}
                  strokeWidth="1"
                />
                <text x={6} y={y + 4} fill="#978f84" fontSize="13" textAnchor="start">
                  {item.label}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="rgba(242, 143, 45, 0.12)" />
          <path
            d={linePath}
            fill="none"
            stroke="#f28f2d"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={linePath}
            fill="none"
            stroke="rgba(255, 178, 90, 0.55)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={lastX} cy={lastY} r="5" fill="#17120d" stroke="#f28f2d" strokeWidth="2" />
          <circle cx={lastX} cy={lastY} r="2.5" fill="#f28f2d" />

          <text x={paddingX} y={height - 2} fill="#978f84" fontSize="13" textAnchor="start">
            {formatAxisLabel(firstPoint.timestamp, range)}
          </text>
          <text x={width / 2} y={height - 2} fill="#978f84" fontSize="13" textAnchor="middle">
            {formatAxisLabel(middlePoint.timestamp, range)}
          </text>
          <text
            x={width - paddingX}
            y={height - 2}
            fill="#978f84"
            fontSize="13"
            textAnchor="end"
          >
            {formatAxisLabel(latestPoint.timestamp, range)}
          </text>
        </svg>

        <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle/80 pt-3 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Achsenkontext: unten Zeit, links Preisniveau. Die Skala passt sich automatisch an den
            gewaelten Zeitraum an.
          </p>
          <p>Letzter sichtbarer Punkt: {formatCoverageLabel(latestPoint.timestamp, range)}</p>
        </div>
      </div>
    </div>
  );
}
