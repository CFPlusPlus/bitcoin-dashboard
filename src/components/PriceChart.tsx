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
import Label from "./ui/content/Label";

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
    <div className="overflow-hidden rounded-md border border-border-subtle bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-border-default pb-4">
        <p className="text-sm font-medium text-fg">
          {formatMessage(copy.contextLine, {
            currency: currency.toUpperCase(),
            range: rangeLabel,
          })}
        </p>
        <div className="flex flex-col gap-2 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.direction}</p>
          <p className="font-medium text-fg-secondary">
            {formatMessage(copy.timeWindow, {
              end: formatChartAxisLabel(latestPoint.timestamp, range, locale),
              start: formatChartAxisLabel(firstPoint.timestamp, range, locale),
            })}
          </p>
        </div>
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

      <div className="mt-4 grid gap-3 border-t border-border-default pt-4 sm:grid-cols-3">
        <div className="min-w-0">
          <Label tone="muted">{copy.lowInWindow}</Label>
          <p className="mt-2 font-numeric tabular-nums text-base text-fg">
            {formatCurrency(minPrice, currency, locale)}
          </p>
        </div>

        <div className="min-w-0">
          <Label tone="muted">{copy.highInWindow}</Label>
          <p className="mt-2 font-numeric tabular-nums text-base text-fg">
            {formatCurrency(maxPrice, currency, locale)}
          </p>
        </div>

        <div className="min-w-0">
          <Label tone="muted">{copy.latest}</Label>
          <p className="mt-2 font-numeric tabular-nums text-base text-fg">
            {formatCurrency(currentPrice, currency, locale)}
          </p>
          <p className={`mt-2 text-sm font-medium ${changeTone}`}>
            {formatCurrency(absoluteChange, currency, locale)} (
            {formatPercent(relativeChange, locale)})
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-border-default pt-4 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{copy.axisContext}</p>
        <p>
          {formatMessage(copy.lastVisiblePoint, {
            value: formatChartCoverageLabel(latestPoint.timestamp, range, locale),
          })}
        </p>
      </div>
    </div>
  );
}
