"use client";

import { type PointerEvent, useState } from "react";
import { useI18n } from "../i18n/context";
import { formatMessage } from "../i18n/template";
import { formatCurrency, formatPercent } from "../lib/format";
import type { ChartPoint, ChartRange, Currency } from "../types/dashboard";

type PriceChartProps = {
  currency: Currency;
  points: ChartPoint[];
  range: ChartRange;
};

function getRangeLabel(
  range: ChartRange,
  locale: "de" | "en",
  copy: ReturnType<typeof useI18n>["messages"]["dashboard"]["chart"]
) {
  if (range === 1) return copy.rangeLabel24h;
  if (range === 7) return copy.rangeLabel7d;
  return copy.rangeLabel30d;
}

function formatAxisLabel(timestamp: number, range: ChartRange, locale: "de" | "en") {
  const date = new Date(timestamp);
  const code = locale === "de" ? "de-DE" : "en-US";

  if (range === 1) {
    return new Intl.DateTimeFormat(code, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat(code, {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatCoverageLabel(timestamp: number, range: ChartRange, locale: "de" | "en") {
  const date = new Date(timestamp);
  const code = locale === "de" ? "de-DE" : "en-US";

  return new Intl.DateTimeFormat(
    code,
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

function formatTooltipLabel(timestamp: number, range: ChartRange, locale: "de" | "en") {
  const date = new Date(timestamp);
  const code = locale === "de" ? "de-DE" : "en-US";

  return new Intl.DateTimeFormat(
    code,
    range === 1
      ? {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
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

function getTooltipY({
  pointY,
  tooltipHeight,
  preferredOffset,
  fallbackOffset,
  minY,
  maxY,
}: {
  pointY: number;
  tooltipHeight: number;
  preferredOffset: number;
  fallbackOffset: number;
  minY: number;
  maxY: number;
}) {
  const aboveY = pointY - tooltipHeight - preferredOffset;

  if (aboveY >= minY) {
    return aboveY;
  }

  return Math.min(pointY + fallbackOffset, maxY);
}

function getTooltipWidth(valueLabel: string, dateLabel: string) {
  const longestLine = Math.max(valueLabel.length, dateLabel.length);
  return Math.min(Math.max(longestLine * 7.4 + 20, 96), 146);
}

export default function PriceChart({ currency, points, range }: PriceChartProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.chart;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 900;
  const height = 340;
  const paddingX = 52;
  const paddingY = 24;

  if (points.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border-default bg-surface p-5 text-sm text-fg-muted">
        {copy.emptyChart}
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

  const getX = (index: number) =>
    points.length === 1
      ? width / 2
      : paddingX + (index / (points.length - 1)) * (width - paddingX * 2);

  const getY = (price: number) => {
    const normalized = (price - minPrice) / priceDelta;
    return height - paddingY - normalized * (height - paddingY * 2);
  };

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${getX(index).toFixed(2)} ${getY(point.price).toFixed(2)}`
    )
    .join(" ");
  const hoverablePoints = points.map((point, index) => ({
    ...point,
    index,
    x: getX(index),
    y: getY(point.price),
  }));

  const firstX = getX(0);
  const lastX = getX(points.length - 1);
  const lastY = getY(latestPoint.price);
  const baseY = height - paddingY;
  const areaPath = `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(2)} ${baseY.toFixed(2)} Z`;
  const rangeLabel = getRangeLabel(range, locale, copy);
  const activeHoveredPoint = hoveredIndex === null ? null : (hoverablePoints[hoveredIndex] ?? null);
  const areaFill = "color-mix(in srgb, var(--token-color-accent-primary) 14%, transparent)";
  const lineStroke = "var(--token-color-accent-primary)";
  const lineGlow = "color-mix(in srgb, var(--token-color-accent-strong) 52%, transparent)";
  const axisStroke = "color-mix(in srgb, var(--token-color-text-primary) 10%, transparent)";
  const gridStroke = "color-mix(in srgb, var(--token-color-text-primary) 5%, transparent)";
  const axisLabelFill = "var(--token-color-text-muted)";
  const tooltipFill = "color-mix(in srgb, var(--token-color-bg-app) 90%, black)";
  const tooltipStroke = "color-mix(in srgb, var(--token-color-accent-primary) 24%, transparent)";
  const pointFill = "var(--token-color-bg-app)";
  const pointInner = "var(--token-color-accent-strong)";
  const tooltipValueLabel = activeHoveredPoint
    ? formatCurrency(activeHoveredPoint.price, currency, locale)
    : "";
  const tooltipDateLabel = activeHoveredPoint
    ? formatTooltipLabel(activeHoveredPoint.timestamp, range, locale)
    : "";
  const tooltipWidth = getTooltipWidth(tooltipValueLabel, tooltipDateLabel);
  const tooltipHeight = 46;
  const tooltipX = activeHoveredPoint
    ? Math.min(Math.max(activeHoveredPoint.x - tooltipWidth / 2, 10), width - tooltipWidth - 10)
    : 0;
  const tooltipY = activeHoveredPoint
    ? getTooltipY({
        pointY: activeHoveredPoint.y,
        tooltipHeight,
        preferredOffset: 30,
        fallbackOffset: 18,
        minY: 10,
        maxY: baseY - tooltipHeight - 8,
      })
    : 0;

  function handlePointerMove(event: PointerEvent<SVGRectElement>) {
    if (points.length === 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;

    const pointerX =
      paddingX + ((event.clientX - bounds.left) / bounds.width) * (width - paddingX * 2);
    const clampedX = Math.min(Math.max(pointerX, paddingX), width - paddingX);
    const progress = (clampedX - paddingX) / (width - paddingX * 2 || 1);
    const nextIndex = Math.round(progress * (points.length - 1));
    setHoveredIndex(Math.min(Math.max(nextIndex, 0), points.length - 1));
  }

  function handlePointerLeave() {
    setHoveredIndex(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="border border-accent/30 bg-accent-soft px-3 py-3 xl:col-span-2 2xl:col-span-1">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
            {copy.contextLabel}
          </p>
          <p className="mt-2 text-sm font-medium text-fg">
            {formatMessage(copy.contextLine, {
              currency: currency.toUpperCase(),
              range: rangeLabel,
            })}
          </p>
          <p className="mt-2 text-sm leading-6 text-fg-muted">
            {formatMessage(copy.contextCoverage, {
              start: formatCoverageLabel(firstPoint.timestamp, range, locale),
              end: formatCoverageLabel(latestPoint.timestamp, range, locale),
            })}
          </p>
        </div>

        <div className="border border-border-subtle bg-surface px-3 py-2.5">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
            {copy.lowInWindow}
          </p>
          <p className="mt-2 font-numeric tabular-nums text-base text-fg">
            {formatCurrency(minPrice, currency, locale)}
          </p>
        </div>

        <div className="border border-border-subtle bg-surface px-3 py-2.5">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
            {copy.highInWindow}
          </p>
          <p className="mt-2 font-numeric tabular-nums text-base text-fg">
            {formatCurrency(maxPrice, currency, locale)}
          </p>
        </div>

        <div className="border border-accent/35 bg-accent-soft px-3 py-2.5">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">{copy.latest}</p>
          <p className="mt-2 font-numeric tabular-nums text-base text-fg">
            {formatCurrency(currentPrice, currency, locale)}
          </p>
          <p className={`mt-2 text-sm font-medium ${changeTone}`}>
            {formatCurrency(absoluteChange, currency, locale)} (
            {formatPercent(relativeChange, locale)})
          </p>
        </div>
      </div>

      <div className="overflow-hidden border border-border-subtle bg-surface p-4 sm:p-5">
        <div className="mb-3 flex flex-col gap-2 border-b border-border-subtle/80 pb-3 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.direction}</p>
          <p className="font-medium text-fg-secondary">
            {formatMessage(copy.timeWindow, {
              start: formatAxisLabel(firstPoint.timestamp, range, locale),
              end: formatAxisLabel(latestPoint.timestamp, range, locale),
            })}
          </p>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label={formatMessage(copy.ariaLabel, {
            days: range,
            currency: currency.toUpperCase(),
          })}
        >
          <line
            x1={paddingX}
            y1={baseY}
            x2={width - paddingX}
            y2={baseY}
            stroke={axisStroke}
            strokeWidth="1"
          />

          {[
            { label: formatCurrency(maxPrice, currency, locale), value: maxPrice, dashed: true },
            {
              label: formatCurrency(midpointPrice, currency, locale),
              value: midpointPrice,
              dashed: true,
            },
            { label: formatCurrency(minPrice, currency, locale), value: minPrice, dashed: false },
          ].map((item) => {
            const y = getY(item.value);

            return (
              <g key={`${item.label}-${item.value}`}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke={gridStroke}
                  strokeDasharray={item.dashed ? "6 10" : undefined}
                  strokeWidth="1"
                />
                <text x={6} y={y + 4} fill={axisLabelFill} fontSize="13" textAnchor="start">
                  {item.label}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill={areaFill} />
          <path
            d={linePath}
            fill="none"
            stroke={lineStroke}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={linePath}
            fill="none"
            stroke={lineGlow}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {activeHoveredPoint ? (
            <>
              <line
                x1={activeHoveredPoint.x}
                y1={paddingY}
                x2={activeHoveredPoint.x}
                y2={baseY}
                stroke={tooltipStroke}
                strokeDasharray="5 7"
                strokeWidth="1"
              />
              <circle
                cx={activeHoveredPoint.x}
                cy={activeHoveredPoint.y}
                r="6"
                fill={pointFill}
                stroke={lineStroke}
                strokeWidth="2"
              />
              <circle
                cx={activeHoveredPoint.x}
                cy={activeHoveredPoint.y}
                r="2.5"
                fill={pointInner}
              />
            </>
          ) : null}
          <circle
            cx={lastX}
            cy={lastY}
            r="5"
            fill={pointFill}
            stroke={lineStroke}
            strokeWidth="2"
          />
          <circle cx={lastX} cy={lastY} r="2.5" fill={lineStroke} />
          <rect
            x={paddingX}
            y={paddingY}
            width={width - paddingX * 2}
            height={height - paddingY * 2}
            fill="transparent"
            className="cursor-crosshair"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          />
          {activeHoveredPoint ? (
            <g pointerEvents="none">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="6"
                fill={tooltipFill}
                stroke={tooltipStroke}
              />
              <text
                x={tooltipX + 10}
                y={tooltipY + 18}
                fill="var(--token-color-text-primary)"
                fontSize="13"
                fontWeight="600"
              >
                {tooltipValueLabel}
              </text>
              <text
                x={tooltipX + 10}
                y={tooltipY + 33}
                fill="var(--token-color-text-muted)"
                fontSize="11.5"
              >
                {tooltipDateLabel}
              </text>
            </g>
          ) : null}

          <text x={paddingX} y={height - 2} fill={axisLabelFill} fontSize="13" textAnchor="start">
            {formatAxisLabel(firstPoint.timestamp, range, locale)}
          </text>
          <text x={width / 2} y={height - 2} fill={axisLabelFill} fontSize="13" textAnchor="middle">
            {formatAxisLabel(middlePoint.timestamp, range, locale)}
          </text>
          <text
            x={width - paddingX}
            y={height - 2}
            fill={axisLabelFill}
            fontSize="13"
            textAnchor="end"
          >
            {formatAxisLabel(latestPoint.timestamp, range, locale)}
          </text>
        </svg>

        <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle/80 pt-3 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.axisContext}</p>
          <p>
            {formatMessage(copy.lastVisiblePoint, {
              value: formatCoverageLabel(latestPoint.timestamp, range, locale),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
