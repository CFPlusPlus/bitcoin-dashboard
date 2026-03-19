"use client";

import type { ReactNode } from "react";
import type { AsyncDataState } from "../../lib/data-state";
import type { Network } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatDate, formatNumber, formatPercent } from "../../lib/format";
import { cn } from "../../lib/cn";
import { useI18n } from "../../i18n/context";
import Card from "../../components/ui/Card";
import KpiValue from "../../components/ui/content/KpiValue";
import MetaText from "../../components/ui/content/MetaText";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import Cluster from "../../components/ui/layout/Cluster";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";

type NetworkOverviewSectionProps = {
  network: Network | null;
  networkState: AsyncDataState<Network>;
  onRetry: () => void;
};

function formatDecimal(value: number | null, locale: string, maximumFractionDigits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

function formatFee(value: number | null, locale: string) {
  const formatted = formatDecimal(value, locale, value !== null && value < 10 ? 1 : 0);
  return formatted ? `${formatted} sat/vB` : null;
}

function formatDifficulty(value: number | null, locale: string) {
  const formatted = formatDecimal(value ? value / 1e12 : null, locale, 1);
  return formatted ? `${formatted} T` : null;
}

function formatHashrate(value: number | null, locale: string) {
  const formatted = formatDecimal(value, locale, value !== null && value < 100 ? 1 : 0);
  return formatted ? `${formatted} EH/s` : null;
}

function Sparkline({
  points,
  strokeClassName,
}: {
  points: Array<{ ehPerSecond: number; timestamp: number }>;
  strokeClassName: string;
}) {
  if (points.length < 2) {
    return <div className="h-28 rounded-sm border border-border-subtle bg-surface/50" />;
  }

  const values = points.map((point) => point.ehPerSecond);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 100;
  const height = 44;

  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.ehPerSecond - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const areaPath = `${path} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="h-28 w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="hashrateAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#hashrateAreaGradient)" className={strokeClassName} />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
        className={strokeClassName}
      />
    </svg>
  );
}

function NetworkPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[18rem] flex-col gap-4 border border-border-subtle bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-4 py-4",
        className
      )}
    >
      <MetaText size="xs" className="font-mono uppercase tracking-[0.24em]">
        {title}
      </MetaText>
      {children}
    </div>
  );
}

function StatLabel({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <Stack gap="sm">
      <KpiValue label={label} value={value} meta={detail} size="md" tone={tone} />
    </Stack>
  );
}

function DetailRow({
  label,
  value,
  leading,
  detail,
}: {
  label: string;
  value: string;
  leading?: ReactNode;
  detail?: string;
}) {
  return (
    <Stack gap="xs" className="border-b border-border-subtle/70 pb-2 last:border-b-0 last:pb-0">
      <Cluster align="center" justify="between" gap="md">
        <Cluster align="center" gap="sm" className="min-w-0">
          {leading}
          <MetaText size="xs" className="font-mono uppercase tracking-[0.16em]">
            {label}
          </MetaText>
        </Cluster>
        <MetaText tone="strong" className="font-mono text-right">
          {value}
        </MetaText>
      </Cluster>
      {detail ? <MetaText>{detail}</MetaText> : null}
    </Stack>
  );
}

function FeePriorityRow({
  label,
  value,
  displayValue,
  barClassName,
  maxFee,
}: {
  label: string;
  value: number | null;
  displayValue: string;
  barClassName: string;
  maxFee: number;
}) {
  return (
    <Stack gap="sm" className="border-b border-border-subtle/70 pb-3 last:border-b-0 last:pb-0">
      <Cluster align="center" justify="between" gap="md">
        <MetaText size="xs" className="font-mono uppercase tracking-[0.16em]">
          {label}
        </MetaText>
        <MetaText tone="strong" className="font-mono">
          {displayValue}
        </MetaText>
      </Cluster>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface">
        <div
          className={cn("h-full rounded-full", barClassName)}
          style={{
            width: `${Math.max(8, ((value ?? 0) / maxFee) * 100)}%`,
          }}
        />
      </div>
    </Stack>
  );
}

export default function NetworkOverviewSection({
  network,
  networkState,
  onRetry,
}: NetworkOverviewSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.network;
  const fallback = messages.common.unavailable;
  const numberLocale = locale === "de" ? "de-DE" : "en-US";
  const stateMessages = getDashboardSectionStateMessages("network", networkState.error, locale);

  const highPriorityFee = formatFee(network?.fees.fastestFee ?? null, numberLocale) ?? fallback;
  const mediumPriorityFee = formatFee(network?.fees.halfHourFee ?? null, numberLocale) ?? fallback;
  const lowPriorityFee = formatFee(network?.fees.minimumFee ?? null, numberLocale) ?? fallback;
  const hashrateIsPositive = (network?.hashrate.changePercent30d ?? 0) >= 0;
  const difficultyIsPositive = (network?.difficulty.adjustmentPercent ?? 0) >= 0;
  const maxFee = Math.max(
    network?.fees.fastestFee ?? 0,
    network?.fees.halfHourFee ?? 0,
    network?.fees.minimumFee ?? 0,
    1
  );

  return (
    <Card as="section" tone="muted" padding="md" className="gap-4 border-border-default/80">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        meta={<DataStateMeta state={networkState} />}
      />

      <DataState
        state={networkState}
        onRetry={onRetry}
        retryBusy={networkState.isLoading}
        messages={stateMessages}
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <NetworkPanel title={copy.statsCardTitle}>
            <div className="grid gap-5 sm:grid-cols-2">
              <StatLabel
                label={copy.latestBlock}
                value={
                  network?.latestBlockHeight === null || network?.latestBlockHeight === undefined
                    ? fallback
                    : formatNumber(network.latestBlockHeight, locale)
                }
              />
              <StatLabel
                label={copy.hashrateCurrentLabel}
                value={formatHashrate(network?.hashrate.currentEhPerSecond ?? null, numberLocale) ?? fallback}
              />
              <StatLabel
                label={copy.difficultyCurrentLabel}
                value={formatDifficulty(network?.difficulty.current ?? null, numberLocale) ?? fallback}
              />
              <StatLabel
                label={copy.pendingTransactionsLabel}
                value={formatNumber(network?.mempool.pendingTransactions ?? null, locale)}
              />
              <StatLabel
                label={copy.priorityFeeLabel}
                value={highPriorityFee}
              />
              <StatLabel
                label={copy.unconfirmedSizeLabel}
                value={
                  network?.mempool.pendingVirtualSizeMb === null ||
                  network?.mempool.pendingVirtualSizeMb === undefined
                    ? fallback
                    : `${formatDecimal(network.mempool.pendingVirtualSizeMb, numberLocale, 1)} MB`
                }
              />
            </div>
          </NetworkPanel>

          <NetworkPanel title={copy.hashrateCardTitle}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <KpiValue
                  value={formatHashrate(network?.hashrate.currentEhPerSecond ?? null, numberLocale) ?? fallback}
                  size="md"
                />
                <div
                  className={cn(
                    "w-fit rounded-sm px-2 py-1 font-mono text-sm font-medium",
                    hashrateIsPositive ? "bg-success/12 text-success" : "bg-danger/12 text-danger"
                  )}
                >
                  <span className={hashrateIsPositive ? "text-success" : "text-danger"}>
                    {formatPercent(network?.hashrate.changePercent30d ?? null, locale)}
                  </span>{" "}
                  <span>(30d)</span>
                </div>
              </div>
            </div>

            <div className="text-accent">
              <Sparkline
                points={network?.hashrate.points ?? []}
                strokeClassName="text-accent"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatLabel
                label={copy.hashrateLowLabel}
                value={formatHashrate(network?.hashrate.stats.low30d ?? null, numberLocale) ?? fallback}
              />
              <StatLabel
                label={copy.hashrateHighLabel}
                value={formatHashrate(network?.hashrate.stats.high30d ?? null, numberLocale) ?? fallback}
              />
              <StatLabel
                label={copy.hashrateAverageLabel}
                value={formatHashrate(network?.hashrate.stats.average30d ?? null, numberLocale) ?? fallback}
              />
            </div>
          </NetworkPanel>

          <NetworkPanel title={copy.difficultyCardTitle}>
            <KpiValue
              value={formatPercent(network?.difficulty.adjustmentPercent ?? null, locale)}
              size="md"
              tone={difficultyIsPositive ? "positive" : "negative"}
            />

            <div className="flex flex-col gap-2">
              <div className="h-4 overflow-hidden rounded-full bg-surface">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    difficultyIsPositive ? "bg-success" : "bg-danger"
                  )}
                  style={{
                    width: `${Math.max(0, Math.min(100, network?.difficulty.progressPercent ?? 0))}%`,
                  }}
                />
              </div>
              <MetaText>
                {network?.difficulty.progressPercent === null ||
                network?.difficulty.progressPercent === undefined
                  ? fallback
                  : `${formatDecimal(network.difficulty.progressPercent, numberLocale, 1)}% ${copy.epochCompleteLabel}`}
              </MetaText>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatLabel
                label={copy.blocksLeftLabel}
                value={formatNumber(network?.difficulty.remainingBlocks ?? null, locale)}
              />
              <StatLabel
                label={copy.estimatedDateLabel}
                value={formatDate(network?.difficulty.estimatedRetargetDate ?? null, locale)}
              />
              <StatLabel
                label={copy.retargetLabel}
                value={
                  network?.difficulty.nextRetargetHeight === null ||
                  network?.difficulty.nextRetargetHeight === undefined
                    ? fallback
                    : `#${formatNumber(network.difficulty.nextRetargetHeight, locale)}`
                }
              />
            </div>
          </NetworkPanel>

          <NetworkPanel title={copy.feesCardTitle}>
            <Stack gap="md">
              {[
                {
                  label: copy.highPriorityLabel,
                  value: network?.fees.fastestFee ?? null,
                  text: highPriorityFee,
                  barClassName: "bg-danger",
                },
                {
                  label: copy.mediumPriorityLabel,
                  value: network?.fees.halfHourFee ?? null,
                  text: mediumPriorityFee,
                  barClassName: "bg-accent",
                },
                {
                  label: copy.lowPriorityLabel,
                  value: network?.fees.minimumFee ?? null,
                  text: lowPriorityFee,
                  barClassName: "bg-success",
                },
              ].map((item) => (
                <FeePriorityRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  displayValue={item.text}
                  barClassName={item.barClassName}
                  maxFee={maxFee}
                />
              ))}
            </Stack>

            <Stack gap="md">
              <MetaText size="xs" className="font-mono uppercase tracking-[0.2em]">
                {copy.projectedBlocksTitle}
              </MetaText>
              <Stack gap="sm">
                {(network?.mempool.projectedBlocks ?? []).map((block) => (
                  <DetailRow
                    key={block.blockIndex}
                    label={`#${block.blockIndex}`}
                    leading={<span className="size-2 rounded-full bg-accent" aria-hidden="true" />}
                    value={
                      block.minFeeRate === null || block.maxFeeRate === null
                        ? fallback
                        : `${formatDecimal(block.minFeeRate, numberLocale, 1)}-${formatDecimal(block.maxFeeRate, numberLocale, 1)} sat/vB`
                    }
                    detail={
                      block.transactionCount === null
                        ? fallback
                        : `${formatNumber(block.transactionCount, locale)} ${copy.transactionsSuffix}`
                    }
                  />
                ))}
              </Stack>
            </Stack>
          </NetworkPanel>
        </div>
      </DataState>
    </Card>
  );
}
