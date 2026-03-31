"use client";
import { useI18n } from "../i18n/context";
import { formatMessage } from "../i18n/template";
import {
  formatChartAxisLabel,
  formatChartCoverageLabel,
  formatChartTooltipLabel,
} from "../lib/chart-format";
import { formatCurrency, formatPercent } from "../lib/format";
import type { ChartPoint, ChartRange, Currency } from "../types/dashboard";
import BaseLineChart from "./charts/BaseLineChart";

type PriceChartProps = {
  currency: Currency;
  points: ChartPoint[];
  range: ChartRange;
};

function getRangeLabel(
  range: ChartRange,
  _locale: "de" | "en",
  copy: ReturnType<typeof useI18n>["messages"]["dashboard"]["chart"]
) {
  if (range === 1) return copy.rangeLabel24h;
  if (range === 7) return copy.rangeLabel7d;
  return copy.rangeLabel30d;
}

export default function PriceChart({ currency, points, range }: PriceChartProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.chart;

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
  const firstPoint = points[0];
  const latestPoint = points[points.length - 1];
  const currentPrice = latestPoint.price;
  const absoluteChange = latestPoint.price - firstPoint.price;
  const relativeChange = firstPoint.price === 0 ? null : (absoluteChange / firstPoint.price) * 100;
  const changeTone =
    absoluteChange > 0 ? "text-success" : absoluteChange < 0 ? "text-danger" : "text-fg";
  const rangeLabel = getRangeLabel(range, locale, copy);
  const chartPoints = points.map((point) => ({ x: point.timestamp, y: point.price }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="rounded-md border border-accent/30 bg-accent-soft px-3 py-3 xl:col-span-2 2xl:col-span-1">
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
              end: formatChartCoverageLabel(latestPoint.timestamp, range, locale),
              start: formatChartCoverageLabel(firstPoint.timestamp, range, locale),
            })}
          </p>
        </div>

        <div className="rounded-md border border-border-subtle bg-surface px-3 py-2.5">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
            {copy.lowInWindow}
          </p>
          <p className="mt-2 font-numeric tabular-nums text-base text-fg">
            {formatCurrency(minPrice, currency, locale)}
          </p>
        </div>

        <div className="rounded-md border border-border-subtle bg-surface px-3 py-2.5">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
            {copy.highInWindow}
          </p>
          <p className="mt-2 font-numeric tabular-nums text-base text-fg">
            {formatCurrency(maxPrice, currency, locale)}
          </p>
        </div>

        <div className="rounded-md border border-accent/35 bg-accent-soft px-3 py-2.5">
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

      <div className="overflow-hidden rounded-md border border-border-subtle bg-surface p-4 sm:p-5">
        <div className="mb-3 flex flex-col gap-2 border-b border-border-subtle/80 pb-3 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.direction}</p>
          <p className="font-medium text-fg-secondary">
            {formatMessage(copy.timeWindow, {
              end: formatChartAxisLabel(latestPoint.timestamp, range, locale),
              start: formatChartAxisLabel(firstPoint.timestamp, range, locale),
            })}
          </p>
        </div>

        <BaseLineChart
          ariaLabel={formatMessage(copy.ariaLabel, {
            currency: currency.toUpperCase(),
            days: range,
          })}
          height={340}
          points={chartPoints}
          showArea
          showVerticalHoverGuide
          showXAxis
          showYAxis
          tone="accent"
          tooltipTitleFormatter={(value) => formatChartTooltipLabel(value, range, locale)}
          tooltipValueFormatter={(value) => formatCurrency(value, currency, locale)}
          xTickFormatter={(value) => formatChartAxisLabel(value, range, locale)}
          yTickFormatter={(value) => formatCurrency(value, currency, locale)}
        />

        <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle/80 pt-3 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.axisContext}</p>
          <p>
            {formatMessage(copy.lastVisiblePoint, {
              value: formatChartCoverageLabel(latestPoint.timestamp, range, locale),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
