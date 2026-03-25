"use client";

import { type PointerEvent, type ReactNode, useState } from "react";
import { formatCompactCurrency } from "../lib/format";
import { useI18n } from "../i18n/context";
import type { Currency, MarketContextChartPoint } from "../types/dashboard";
import KpiValue from "./ui/content/KpiValue";
import MetaText from "./ui/content/MetaText";
import Cluster from "./ui/layout/Cluster";
import Stack from "./ui/layout/Stack";

type MarketMetricChartProps = {
  currentValue: ReactNode;
  currency: Currency;
  label: string;
  meta?: ReactNode;
  points: MarketContextChartPoint[];
  tone?: "accent" | "default";
};

function formatTooltipDate(timestamp: number, locale: "de" | "en") {
  const code = locale === "de" ? "de-DE" : "en-US";
  return new Intl.DateTimeFormat(code, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(timestamp));
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
  return Math.min(Math.max(longestLine * 7.2 + 18, 92), 126);
}

export default function MarketMetricChart({
  currentValue,
  currency,
  label,
  meta,
  points,
  tone = "default",
}: MarketMetricChartProps) {
  const { locale } = useI18n();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPointerY, setHoverPointerY] = useState<number | null>(null);
  const width = 640;
  const height = 70;
  const paddingX = 8;
  const paddingTop = 10;
  const paddingBottom = 6;

  if (points.length === 0) {
    return null;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const delta = max - min || 1;
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const baseY = height - paddingBottom;
  const absoluteChange = lastPoint.value - firstPoint.value;
  const relativeChange = firstPoint.value === 0 ? 0 : (absoluteChange / firstPoint.value) * 100;
  const deltaTone = relativeChange > 0 ? "positive" : relativeChange < 0 ? "negative" : "neutral";
  const deltaLabel = `${relativeChange > 0 ? "+" : ""}${relativeChange.toFixed(1)}% (30d)`;

  const getX = (index: number) =>
    points.length === 1
      ? width / 2
      : paddingX + (index / (points.length - 1)) * (width - paddingX * 2);

  const getY = (value: number) => {
    const normalized = (value - min) / delta;
    return baseY - normalized * (height - paddingTop - paddingBottom);
  };

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${getX(index).toFixed(2)} ${getY(point.value).toFixed(2)}`
    )
    .join(" ");
  const hoverablePoints = points.map((point, index) => ({
    ...point,
    index,
    x: getX(index),
    y: getY(point.value),
  }));

  const firstX = getX(0);
  const lastX = getX(points.length - 1);
  const lastY = getY(lastPoint.value);
  const areaPath = `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(2)} ${baseY.toFixed(2)} Z`;

  const stroke =
    tone === "accent" ? "var(--token-color-accent-primary)" : "var(--token-color-text-secondary)";
  const glow =
    tone === "accent"
      ? "color-mix(in srgb, var(--token-color-accent-strong) 20%, transparent)"
      : "color-mix(in srgb, var(--token-color-text-secondary) 16%, transparent)";
  const area =
    tone === "accent"
      ? "color-mix(in srgb, var(--token-color-accent-primary) 10%, transparent)"
      : "color-mix(in srgb, var(--token-color-text-primary) 5%, transparent)";
  const activeHoveredPoint = hoveredIndex === null ? null : (hoverablePoints[hoveredIndex] ?? null);
  const tooltipValueLabel = activeHoveredPoint
    ? formatCompactCurrency(activeHoveredPoint.value, currency, locale, 1)
    : "";
  const tooltipDateLabel = activeHoveredPoint
    ? formatTooltipDate(activeHoveredPoint.timestamp, locale)
    : "";
  const tooltipWidth = getTooltipWidth(tooltipValueLabel, tooltipDateLabel);
  const tooltipHeight = 42;
  const tooltipX = activeHoveredPoint
    ? Math.min(Math.max(activeHoveredPoint.x - tooltipWidth / 2, 6), width - tooltipWidth - 6)
    : 0;
  const tooltipY = activeHoveredPoint
    ? getTooltipY({
        pointY: hoverPointerY ?? activeHoveredPoint.y,
        tooltipHeight,
        preferredOffset: 18,
        fallbackOffset: 16,
        minY: -tooltipHeight - 10,
        maxY: baseY - tooltipHeight - 4,
      })
    : 0;

  function handlePointerMove(event: PointerEvent<SVGRectElement>) {
    if (points.length === 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;

    const pointerX =
      paddingX + ((event.clientX - bounds.left) / bounds.width) * (width - paddingX * 2);
    const pointerY =
      paddingTop +
      ((event.clientY - bounds.top) / bounds.height) * (height - paddingTop - paddingBottom);
    const clampedX = Math.min(Math.max(pointerX, paddingX), width - paddingX);
    const clampedY = Math.min(Math.max(pointerY, paddingTop), baseY);
    const progress = (clampedX - paddingX) / (width - paddingX * 2 || 1);
    const nextIndex = Math.round(progress * (points.length - 1));

    setHoveredIndex(Math.min(Math.max(nextIndex, 0), points.length - 1));
    setHoverPointerY(clampedY);
  }

  function handlePointerLeave() {
    setHoveredIndex(null);
    setHoverPointerY(null);
  }

  return (
    <div className="relative rounded-md border border-border-subtle bg-surface">
      <div className="px-4 pt-4">
        <Stack gap="sm" className="min-w-0">
          <Cluster align="center" gap="sm">
            <KpiValue label={label} value={currentValue} size="md" />
            <span
              className={
                deltaTone === "positive"
                  ? "inline-flex min-h-7 items-center rounded-md bg-success/12 px-2.5 text-sm font-semibold text-success"
                  : deltaTone === "negative"
                    ? "inline-flex min-h-7 items-center rounded-md bg-danger/12 px-2.5 text-sm font-semibold text-danger"
                    : "inline-flex min-h-7 items-center rounded-md bg-elevated px-2.5 text-sm font-semibold text-fg-secondary"
              }
            >
              {deltaLabel}
            </span>
          </Cluster>
          {meta ? <MetaText>{meta}</MetaText> : null}
        </Stack>
      </div>

      <div className="px-2 pb-2 pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label={label}
        >
          <path d={areaPath} fill={area} />
          <path
            d={linePath}
            fill="none"
            stroke={glow}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={linePath}
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {activeHoveredPoint ? (
            <>
              <line
                x1={activeHoveredPoint.x}
                y1={paddingTop}
                x2={activeHoveredPoint.x}
                y2={baseY}
                stroke="color-mix(in srgb, var(--token-color-text-primary) 18%, transparent)"
                strokeDasharray="4 5"
                strokeWidth="1"
              />
              <circle
                cx={activeHoveredPoint.x}
                cy={activeHoveredPoint.y}
                r="4.5"
                fill="var(--token-color-bg-app)"
                stroke={stroke}
                strokeWidth="1.4"
              />
              <circle cx={activeHoveredPoint.x} cy={activeHoveredPoint.y} r="1.9" fill={stroke} />
            </>
          ) : null}
          <circle
            cx={lastX}
            cy={lastY}
            r="3"
            fill="var(--token-color-bg-app)"
            stroke={stroke}
            strokeWidth="1.2"
          />
          <rect
            x={paddingX}
            y={paddingTop}
            width={width - paddingX * 2}
            height={height - paddingTop - paddingBottom}
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
                fill="color-mix(in srgb, var(--token-color-bg-app) 90%, black)"
                stroke={
                  tone === "accent"
                    ? "color-mix(in srgb, var(--token-color-accent-primary) 24%, transparent)"
                    : "color-mix(in srgb, var(--token-color-text-secondary) 18%, transparent)"
                }
              />
              <text
                x={tooltipX + 9}
                y={tooltipY + 17}
                fill="var(--token-color-text-primary)"
                fontSize="12.5"
                fontWeight="600"
              >
                {tooltipValueLabel}
              </text>
              <text
                x={tooltipX + 9}
                y={tooltipY + 31}
                fill="var(--token-color-text-muted)"
                fontSize="11"
              >
                {tooltipDateLabel}
              </text>
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
