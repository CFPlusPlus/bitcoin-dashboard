"use client";

import type { ReactNode } from "react";
import type { MarketContextChartPoint } from "../types/dashboard";
import KpiValue from "./ui/content/KpiValue";
import MetaText from "./ui/content/MetaText";
import Cluster from "./ui/layout/Cluster";
import Stack from "./ui/layout/Stack";

type MarketMetricChartProps = {
  currentValue: ReactNode;
  label: string;
  meta?: ReactNode;
  points: MarketContextChartPoint[];
  tone?: "accent" | "default";
};

export default function MarketMetricChart({
  currentValue,
  label,
  meta,
  points,
  tone = "default",
}: MarketMetricChartProps) {
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
  const deltaTone =
    relativeChange > 0 ? "positive" : relativeChange < 0 ? "negative" : "neutral";
  const deltaLabel = `${relativeChange > 0 ? "+" : ""}${relativeChange.toFixed(1)}% (30d)`;

  const getX = (index: number) =>
    points.length === 1 ? width / 2 : paddingX + (index / (points.length - 1)) * (width - paddingX * 2);

  const getY = (value: number) => {
    const normalized = (value - min) / delta;
    return baseY - normalized * (height - paddingTop - paddingBottom);
  };

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${getX(index).toFixed(2)} ${getY(point.value).toFixed(2)}`)
    .join(" ");

  const firstX = getX(0);
  const lastX = getX(points.length - 1);
  const lastY = getY(lastPoint.value);
  const areaPath = `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(2)} ${baseY.toFixed(2)} Z`;

  const stroke = tone === "accent" ? "#f28f2d" : "#e7dfd4";
  const glow = tone === "accent" ? "rgba(255, 178, 90, 0.18)" : "rgba(231, 223, 212, 0.14)";
  const area = tone === "accent" ? "rgba(242, 143, 45, 0.06)" : "rgba(231, 223, 212, 0.04)";

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-[linear-gradient(180deg,rgba(22,19,17,0.98),rgba(15,13,12,0.98))]">
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
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" role="img" aria-label={label}>
          <path d={areaPath} fill={area} />
          <path d={linePath} fill="none" stroke={glow} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={lastX} cy={lastY} r="3" fill="#17120d" stroke={stroke} strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  );
}
