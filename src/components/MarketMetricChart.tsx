"use client";

import type { ReactNode } from "react";
import { useI18n } from "../i18n/context";
import { formatChartShortDateLabel } from "../lib/chart-format";
import { formatCompactCurrency } from "../lib/format";
import type { Currency, MarketContextChartPoint } from "../types/dashboard";
import BaseLineChart from "./charts/BaseLineChart";
import KpiValue from "./ui/content/KpiValue";
import MetaText from "./ui/content/MetaText";
import Cluster from "./ui/layout/Cluster";
import Stack from "./ui/layout/Stack";
import DashboardPanel from "./ui/patterns/DashboardPanel";

type MarketMetricChartProps = {
  currentValue: ReactNode;
  currency: Currency;
  label: string;
  meta?: ReactNode;
  points: MarketContextChartPoint[];
  tone?: "accent" | "default";
};

export default function MarketMetricChart({
  currentValue,
  currency,
  label,
  meta,
  points,
  tone = "default",
}: MarketMetricChartProps) {
  const { locale } = useI18n();

  if (points.length === 0) {
    return null;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const absoluteChange = lastPoint.value - firstPoint.value;
  const relativeChange = firstPoint.value === 0 ? 0 : (absoluteChange / firstPoint.value) * 100;
  const deltaTone = relativeChange > 0 ? "positive" : relativeChange < 0 ? "negative" : "neutral";
  const deltaLabel = `${relativeChange > 0 ? "+" : ""}${relativeChange.toFixed(1)}% (30d)`;
  const chartPoints = points.map((point) => ({ x: point.timestamp, y: point.value }));

  return (
    <DashboardPanel tone={tone === "accent" ? "accent" : "default"} className="relative">
      <div className="px-4 pt-4">
        <Stack gap="sm" className="min-w-0">
          <Cluster align="center" gap="sm">
            <KpiValue label={label} value={currentValue} size="md" />
            <span
              className={
                deltaTone === "positive"
                  ? "inline-flex min-h-7 items-center rounded-md border border-success bg-muted-surface px-2.5 text-sm font-medium text-success"
                  : deltaTone === "negative"
                    ? "inline-flex min-h-7 items-center rounded-md border border-danger bg-muted-surface px-2.5 text-sm font-medium text-danger"
                    : "inline-flex min-h-7 items-center rounded-md bg-elevated px-2.5 text-sm font-medium text-fg-secondary"
              }
            >
              {deltaLabel}
            </span>
          </Cluster>
          {meta ? <MetaText>{meta}</MetaText> : null}
        </Stack>
      </div>

      <div className="px-2 pb-2 pt-2">
        <BaseLineChart
          ariaLabel={label}
          compact
          height={72}
          points={chartPoints}
          showArea
          showVerticalHoverGuide
          showXAxis={false}
          showYAxis={false}
          tone={tone}
          tooltipTitleFormatter={(value) => formatChartShortDateLabel(value, locale)}
          tooltipValueFormatter={(value) => formatCompactCurrency(value, currency, locale, 1)}
        />
      </div>
    </DashboardPanel>
  );
}
