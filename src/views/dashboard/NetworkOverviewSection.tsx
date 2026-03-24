"use client";

import { type PointerEvent, type ReactNode, useId, useState } from "react";
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

function formatMinutes(value: number | null, locale: string) {
  const formatted = formatDecimal(value, locale, 1);
  return formatted ? `${formatted} min` : null;
}

function formatDifficulty(value: number | null, locale: string) {
  const formatted = formatDecimal(value ? value / 1e12 : null, locale, 1);
  return formatted ? `${formatted} T` : null;
}

function formatHashrate(value: number | null, locale: string) {
  const formatted = formatDecimal(value, locale, value !== null && value < 100 ? 1 : 0);
  return formatted ? `${formatted} EH/s` : null;
}

function formatFileSize(value: number | null, locale: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  if (value >= 1_000_000) {
    return `${formatDecimal(value / 1_000_000, locale, 2)} MB`;
  }

  return `${formatDecimal(value / 1_000, locale, 0)} KB`;
}

function formatBlockEquivalent(value: number | null, locale: string, suffix: string) {
  const formatted = formatDecimal(value, locale, 1);
  return formatted ? `${formatted} ${suffix}` : null;
}

function formatRelativeTimestamp(timestamp: number, locale: "de" | "en", now = Date.now()) {
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  const diffMs = now - timestamp;
  const absDiffSeconds = Math.round(Math.abs(diffMs) / 1000);

  if (absDiffSeconds < 45) {
    return locale === "de" ? "gerade eben" : "just now";
  }

  const formatter = new Intl.RelativeTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    numeric: "auto",
  });
  const units = [
    { amount: 60, unit: "second" as const },
    { amount: 60, unit: "minute" as const },
    { amount: 24, unit: "hour" as const },
    { amount: 7, unit: "day" as const },
  ];

  let valueToFormat = diffMs / 1000;

  for (const currentUnit of units) {
    if (Math.abs(valueToFormat) < currentUnit.amount) {
      return formatter.format(-Math.round(valueToFormat), currentUnit.unit);
    }

    valueToFormat /= currentUnit.amount;
  }

  return formatter.format(-Math.round(valueToFormat), "week");
}

function formatSparklineDate(timestamp: number, locale: "de" | "en") {
  const code = locale === "de" ? "de-DE" : "en-US";
  return new Intl.DateTimeFormat(code, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(timestamp));
}

function getTooltipWidthPx(valueLabel: string, dateLabel: string) {
  const longestLine = Math.max(valueLabel.length, dateLabel.length);
  return Math.min(Math.max(longestLine * 6.8 + 18, 76), 112);
}

function getTooltipTopPercent({
  pointY,
  chartHeight,
  tooltipHeightPx,
  preferredOffsetPx,
  fallbackOffsetPx,
  minPercent,
  maxPercent,
  renderedHeightPx,
}: {
  pointY: number;
  chartHeight: number;
  tooltipHeightPx: number;
  preferredOffsetPx: number;
  fallbackOffsetPx: number;
  minPercent: number;
  maxPercent: number;
  renderedHeightPx: number;
}) {
  const pointPercent = (pointY / chartHeight) * 100;
  const tooltipHeightPercent = (tooltipHeightPx / renderedHeightPx) * 100;
  const preferredOffsetPercent = (preferredOffsetPx / renderedHeightPx) * 100;
  const fallbackOffsetPercent = (fallbackOffsetPx / renderedHeightPx) * 100;
  const abovePercent = pointPercent - tooltipHeightPercent - preferredOffsetPercent;

  if (abovePercent >= minPercent) {
    return abovePercent;
  }

  return Math.min(pointPercent + fallbackOffsetPercent, maxPercent);
}

function Sparkline({
  locale,
  points,
  strokeClassName,
}: {
  locale: "de" | "en";
  points: Array<{ ehPerSecond: number; timestamp: number }>;
  strokeClassName: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientId = `${useId().replace(/:/g, "")}-hashrate-area-gradient`;

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
  const hoverablePoints = points.map((point, index) => ({
    ...point,
    index,
    x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
    y: height - ((point.ehPerSecond - min) / range) * height,
  }));

  const areaPath = `${path} L ${width},${height} L 0,${height} Z`;
  const activeHoveredPoint = hoveredIndex === null ? null : (hoverablePoints[hoveredIndex] ?? null);
  const tooltipValueLabel = activeHoveredPoint
    ? (formatHashrate(activeHoveredPoint.ehPerSecond, locale === "de" ? "de-DE" : "en-US") ?? "n/a")
    : "";
  const tooltipDateLabel = activeHoveredPoint
    ? formatSparklineDate(activeHoveredPoint.timestamp, locale)
    : "";
  const tooltipLeftPercent = activeHoveredPoint
    ? Math.min(Math.max((activeHoveredPoint.x / width) * 100, 8), 92)
    : 0;
  const renderedChartHeight = 112;
  const tooltipWidthPx = getTooltipWidthPx(tooltipValueLabel, tooltipDateLabel);
  const tooltipTopPercent = activeHoveredPoint
    ? getTooltipTopPercent({
        pointY: activeHoveredPoint.y,
        chartHeight: height,
        tooltipHeightPx: 36,
        preferredOffsetPx: 28,
        fallbackOffsetPx: 14,
        minPercent: 4,
        maxPercent: 72,
        renderedHeightPx: renderedChartHeight,
      })
    : 0;
  const markerLeftPercent = activeHoveredPoint ? (activeHoveredPoint.x / width) * 100 : 0;
  const markerTopPercent = activeHoveredPoint ? (activeHoveredPoint.y / height) * 100 : 0;

  function handlePointerMove(event: PointerEvent<SVGRectElement>) {
    if (points.length === 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;

    const pointerX = ((event.clientX - bounds.left) / bounds.width) * width;
    const clampedX = Math.min(Math.max(pointerX, 0), width);
    const nextIndex = Math.round((clampedX / (width || 1)) * (points.length - 1));
    setHoveredIndex(Math.min(Math.max(nextIndex, 0), points.length - 1));
  }

  function handlePointerLeave() {
    setHoveredIndex(null);
  }

  return (
    <div className="relative h-28 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} className={strokeClassName} />
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
          className={strokeClassName}
        />
        {activeHoveredPoint ? (
          <>
            <line
              x1={activeHoveredPoint.x}
              y1={0}
              x2={activeHoveredPoint.x}
              y2={height}
              stroke="currentColor"
              strokeOpacity="0.22"
              strokeDasharray="4 5"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="transparent"
          className="cursor-crosshair"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        />
      </svg>
      {activeHoveredPoint ? (
        <div
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-[#17120d]"
          style={{
            left: `${markerLeftPercent}%`,
            top: `${markerTopPercent}%`,
          }}
        />
      ) : null}
      {activeHoveredPoint ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-[6px] border border-accent/25 bg-[#110d0a] px-2 py-1 shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
          style={{
            left: `${tooltipLeftPercent}%`,
            top: `${tooltipTopPercent}%`,
            width: `${tooltipWidthPx}px`,
          }}
        >
          <div className="text-[10.5px] font-semibold leading-none text-fg">
            {tooltipValueLabel}
          </div>
          <div className="mt-1 text-[9.5px] leading-none text-fg-muted">{tooltipDateLabel}</div>
        </div>
      ) : null}
    </div>
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
        "flex h-full min-h-[18rem] flex-col gap-4 border border-border-subtle bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-4 py-4 sm:px-5 sm:py-5",
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

function SafeValueText({ value }: { value: string }) {
  return <span className="block min-w-0 whitespace-normal [overflow-wrap:anywhere]">{value}</span>;
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
    <Stack gap="sm" className="min-w-0">
      <KpiValue
        className="min-w-0"
        label={label}
        value={<SafeValueText value={value} />}
        meta={detail}
        size="md"
        tone={tone}
      />
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
        <MetaText tone="strong" className="min-w-0 text-right font-mono [overflow-wrap:anywhere]">
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
        <MetaText tone="strong" className="min-w-0 text-right font-mono [overflow-wrap:anywhere]">
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

function RecentBlockTile({
  ageLabel,
  block,
  fallback,
  locale,
  now,
  sizeLabel,
  transactionsSuffix,
}: {
  ageLabel: string;
  block: Network["latestBlocks"][number];
  fallback: string;
  locale: "de" | "en";
  now: number;
  sizeLabel: string;
  transactionsSuffix: string;
}) {
  const numberLocale = locale === "de" ? "de-DE" : "en-US";
  const age = formatRelativeTimestamp(block.timestamp, locale, now) ?? fallback;
  const transactions =
    block.transactionCount === null
      ? fallback
      : `${formatNumber(block.transactionCount, locale)} ${transactionsSuffix}`;
  const size = formatFileSize(block.sizeBytes, numberLocale) ?? fallback;
  const blockUrl = `https://mempool.space/block/${block.height}`;

  return (
    <a
      href={blockUrl}
      target="_blank"
      rel="noreferrer"
      className="min-w-0 border border-border-subtle/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] px-3 py-3 transition-colors duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:border-accent/45 hover:bg-[linear-gradient(180deg,rgba(242,143,45,0.06),rgba(255,255,255,0.01))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <div className="flex h-full flex-col items-center justify-between gap-2 text-center">
        <div className="space-y-1">
          <div className="font-mono text-[1.05rem] font-semibold leading-none tracking-[-0.04em] text-accent">
            #{formatNumber(block.height, locale)}
          </div>
          <MetaText size="xs" className="text-[0.74rem]">
            {age}
          </MetaText>
        </div>
        <div className="space-y-1">
          <div className="font-mono text-[1.35rem] font-medium leading-none tracking-[-0.04em] text-fg">
            {block.transactionCount === null
              ? fallback
              : formatNumber(block.transactionCount, locale)}
          </div>
          <MetaText size="xs" className="text-[0.74rem] uppercase tracking-[0.16em]">
            {transactionsSuffix}
          </MetaText>
        </div>
        <MetaText size="xs" className="font-mono text-[0.78rem] text-fg-secondary">
          {size}
        </MetaText>
      </div>
    </a>
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
  const patientPriorityFee = formatFee(network?.fees.hourFee ?? null, numberLocale) ?? fallback;
  const economyPriorityFee = formatFee(network?.fees.economyFee ?? null, numberLocale) ?? fallback;
  const minimumPriorityFee = formatFee(network?.fees.minimumFee ?? null, numberLocale) ?? fallback;
  const hashrateIsPositive = (network?.hashrate.changePercent30d ?? 0) >= 0;
  const difficultyIsPositive = (network?.difficulty.adjustmentPercent ?? 0) >= 0;
  const nowTimestamp = network?.fetchedAt ? new Date(network.fetchedAt).getTime() : 0;
  const maxFee = Math.max(
    network?.fees.fastestFee ?? 0,
    network?.fees.halfHourFee ?? 0,
    network?.fees.hourFee ?? 0,
    network?.fees.economyFee ?? 0,
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
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-12">
          <NetworkPanel title={copy.statsCardTitle} className="2xl:col-span-5">
            <div className="grid gap-5 sm:grid-cols-2 xl:gap-x-6 xl:gap-y-6">
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
                value={
                  formatHashrate(network?.hashrate.currentEhPerSecond ?? null, numberLocale) ??
                  fallback
                }
              />
              <StatLabel
                label={copy.difficultyCurrentLabel}
                value={
                  formatDifficulty(network?.difficulty.current ?? null, numberLocale) ?? fallback
                }
              />
              <StatLabel
                label={copy.pendingTransactionsLabel}
                value={formatNumber(network?.mempool.pendingTransactions ?? null, locale)}
              />
              <StatLabel label={copy.priorityFeeLabel} value={highPriorityFee} />
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

          <NetworkPanel title={copy.hashrateCardTitle} className="2xl:col-span-7">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <KpiValue
                  value={
                    <SafeValueText
                      value={
                        formatHashrate(
                          network?.hashrate.currentEhPerSecond ?? null,
                          numberLocale
                        ) ?? fallback
                      }
                    />
                  }
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
                locale={locale}
                points={network?.hashrate.points ?? []}
                strokeClassName="text-accent"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatLabel
                label={copy.hashrateLowLabel}
                value={
                  formatHashrate(network?.hashrate.stats.low30d ?? null, numberLocale) ?? fallback
                }
              />
              <StatLabel
                label={copy.hashrateHighLabel}
                value={
                  formatHashrate(network?.hashrate.stats.high30d ?? null, numberLocale) ?? fallback
                }
              />
              <StatLabel
                label={copy.hashrateAverageLabel}
                value={
                  formatHashrate(network?.hashrate.stats.average30d ?? null, numberLocale) ??
                  fallback
                }
              />
            </div>
          </NetworkPanel>

          <NetworkPanel title={copy.difficultyCardTitle} className="2xl:col-span-6">
            <KpiValue
              value={
                <SafeValueText
                  value={formatPercent(network?.difficulty.adjustmentPercent ?? null, locale)}
                />
              }
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

            <div className="grid gap-4 sm:grid-cols-2">
              <StatLabel
                label={copy.blocksLeftLabel}
                value={formatNumber(network?.difficulty.remainingBlocks ?? null, locale)}
              />
              <StatLabel
                label={copy.estimatedDateLabel}
                value={formatDate(network?.difficulty.estimatedRetargetDate ?? null, locale)}
              />
              <div className="sm:col-span-2">
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
            </div>
          </NetworkPanel>

          <NetworkPanel title={copy.feesCardTitle} className="2xl:col-span-6">
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
                  label: copy.hourPriorityLabel,
                  value: network?.fees.hourFee ?? null,
                  text: patientPriorityFee,
                  barClassName: "bg-info",
                },
                {
                  label: copy.economyPriorityLabel,
                  value: network?.fees.economyFee ?? null,
                  text: economyPriorityFee,
                  barClassName: "bg-success/70",
                },
                {
                  label: copy.minimumPriorityLabel,
                  value: network?.fees.minimumFee ?? null,
                  text: minimumPriorityFee,
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

            <Stack gap="md">
              <MetaText size="xs" className="font-mono uppercase tracking-[0.2em]">
                {copy.feeSpreadTitleSafe}
              </MetaText>
              <MetaText>{copy.feeSpreadDescriptionSafe}</MetaText>
              <Stack gap="sm">
                {[
                  {
                    label: copy.fastestToHourSpreadLabelSafe,
                    value: formatFee(network?.feeSpread.fastestToHour ?? null, numberLocale),
                  },
                  {
                    label: copy.hourToMinimumSpreadLabelSafe,
                    value: formatFee(network?.feeSpread.hourToMinimum ?? null, numberLocale),
                  },
                  {
                    label: copy.fastestToMinimumSpreadLabelSafe,
                    value: formatFee(network?.feeSpread.fastestToMinimum ?? null, numberLocale),
                  },
                ].map((item) => (
                  <DetailRow
                    key={item.label}
                    label={item.label}
                    value={item.value ?? fallback}
                    detail={copy.feeSpreadDetailSafe}
                  />
                ))}
              </Stack>
            </Stack>
          </NetworkPanel>

          <NetworkPanel title={copy.activityCardTitleSafe} className="2xl:col-span-12 min-h-0">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatLabel
                label={copy.averageBlockTimeLabelSafe}
                value={
                  formatMinutes(network?.activity.averageBlockTimeMinutes ?? null, numberLocale) ??
                  fallback
                }
                detail={copy.averageBlockTimeMetaSafe}
              />
              <StatLabel
                label={copy.averageTransactionsPerBlockLabelSafe}
                value={formatNumber(network?.activity.averageTransactionsPerBlock ?? null, locale)}
                detail={copy.averageTransactionsPerBlockMetaSafe}
              />
              <StatLabel
                label={copy.averageBlockSizeLabelSafe}
                value={
                  formatFileSize(network?.activity.averageBlockSizeBytes ?? null, numberLocale) ??
                  fallback
                }
                detail={copy.averageBlockSizeMetaSafe}
              />
              <StatLabel
                label={copy.backlogBlocksLabelSafe}
                value={
                  formatBlockEquivalent(
                    network?.mempool.backlogBlocks ?? null,
                    numberLocale,
                    copy.backlogBlocksSuffixSafe
                  ) ?? fallback
                }
                detail={copy.backlogBlocksMetaSafe}
              />
            </div>
          </NetworkPanel>
        </div>

        <NetworkPanel title={copy.latestBlocksTitle} className="mt-2 min-h-0">
          {network?.latestBlocks.length ? (
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
              {network.latestBlocks.map((block) => (
                <RecentBlockTile
                  key={block.height}
                  ageLabel={copy.blockAgeLabel}
                  block={block}
                  fallback={fallback}
                  locale={locale}
                  now={nowTimestamp}
                  sizeLabel={copy.blockSizeLabel}
                  transactionsSuffix={copy.transactionsSuffix}
                />
              ))}
            </div>
          ) : (
            <MetaText>{copy.latestBlocksEmpty}</MetaText>
          )}
        </NetworkPanel>
      </DataState>
    </Card>
  );
}
