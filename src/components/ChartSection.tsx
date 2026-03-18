"use client";

import type { AsyncDataState } from "../lib/data-state";
import type { ChartData, ChartRange, Currency } from "../types/dashboard";
import { getDashboardSectionStateMessages } from "../lib/dashboard-state-copy";
import { formatMessage } from "../i18n/template";
import { useI18n } from "../i18n/context";
import PriceChart from "./PriceChart";
import Button from "./ui/Button";
import Card from "./ui/Card";
import DataState from "./ui/data-state/DataState";
import DataStateMeta from "./ui/data-state/DataStateMeta";
import Cluster from "./ui/layout/Cluster";
import SectionHeader from "./ui/layout/SectionHeader";

type ChartSectionProps = {
  chart: ChartData | null;
  chartState: AsyncDataState<ChartData>;
  currency: Currency;
  onRangeChange: (value: ChartRange) => void;
  onRetry: () => void;
  range: ChartRange;
};

export default function ChartSection({
  chart,
  chartState,
  currency,
  onRangeChange,
  onRetry,
  range,
}: ChartSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.chart;
  const stateMessages = getDashboardSectionStateMessages("chart", chartState.error, locale);

  const rangeOptions: Array<{ helper: string; label: string; value: ChartRange }> = [
    { value: 1, label: "24H", helper: copy.option1Helper },
    { value: 7, label: locale === "de" ? "7T" : "7D", helper: copy.option7Helper },
    { value: 30, label: locale === "de" ? "30T" : "30D", helper: copy.option30Helper },
  ];

  const rangeDescription =
    range === 1 ? copy.rangeLabel24h : range === 7 ? copy.rangeLabel7d : copy.rangeLabel30d;

  return (
    <Card
      as="section"
      id="main-chart-zone"
      tone="elevated"
      padding="md"
      gap="md"
      className="overflow-hidden border-border-default/80"
    >
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={formatMessage(copy.title, { currency: currency.toUpperCase() })}
        description={formatMessage(copy.description, { range: rangeDescription })}
        meta={<DataStateMeta state={chartState} lastUpdatedLabel={messages.common.lastUpdated} />}
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
              {copy.chooseRange}
            </p>
            <Cluster aria-label={copy.chooseRangeAriaLabel} gap="sm">
              {rangeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  active={range === option.value}
                  intent="secondary"
                  size="sm"
                  aria-pressed={range === option.value}
                  title={`${option.label}: ${option.helper}`}
                  className="min-w-[4.5rem]"
                  onClick={() => onRangeChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </Cluster>
            <p className="max-w-[32rem] text-sm text-fg-muted sm:text-right">
              {copy.preserveHint}
            </p>
          </div>
        }
      />

      <DataState
        state={chartState}
        onRetry={onRetry}
        retryBusy={chartState.isLoading}
        retryLabel={copy.retryLabel}
        messages={stateMessages}
      >
        <div className="border border-border-subtle bg-muted-surface p-3 sm:p-4">
          <PriceChart
            points={chart?.points ?? []}
            range={chart?.range ?? range}
            currency={chart?.currency ?? currency}
          />
        </div>
      </DataState>
    </Card>
  );
}
