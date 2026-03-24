"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Network } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatBtc, formatDate, formatNumber, formatPercentValue } from "../../lib/format";
import { formatMessage } from "../../i18n/template";
import { useI18n } from "../../i18n/context";
import Card from "../../components/ui/Card";
import MetaText from "../../components/ui/content/MetaText";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import SectionHeader from "../../components/ui/layout/SectionHeader";

type HalvingSectionProps = {
  halvingState: AsyncDataState<Network>;
  network: Network | null;
  onRetry: () => void;
};

function formatApproxMonthYear(value: string | null, locale: "de" | "en", fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return `~${new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    month: "short",
    year: "numeric",
  }).format(date)}`;
}

function HalvingMetaStat({
  label,
  value,
  align = "left",
}: {
  align?: "left" | "right";
  label: string;
  value: string;
}) {
  return (
    <div className={align === "right" ? "text-left sm:text-right" : "text-left"}>
      <div className="font-numeric tabular-nums text-[1.45rem] font-medium leading-none tracking-[-0.05em] text-fg whitespace-normal [overflow-wrap:anywhere] sm:text-[2rem]">
        {value}
      </div>
      <MetaText size="xs" className="mt-2 font-mono uppercase tracking-[0.22em] text-fg-secondary">
        {label}
      </MetaText>
    </div>
  );
}

function formatRewardValue(value: number | null, locale: "de" | "en", fallback: string) {
  if (value === null || value === undefined) {
    return fallback;
  }

  return `${formatBtc(value, locale)} BTC`;
}

export default function HalvingSection({ halvingState, network, onRetry }: HalvingSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.halving;
  const fallback = messages.common.unavailable;
  const stateMessages = getDashboardSectionStateMessages("halving", halvingState.error, locale);
  const blocksRemaining =
    network?.halving.remainingBlocks === null || network?.halving.remainingBlocks === undefined
      ? fallback
      : `${formatNumber(network.halving.remainingBlocks, locale)} ${copy.blocksSuffix}`;
  const daysRemaining =
    network?.halving.estimatedDaysUntil === null ||
    network?.halving.estimatedDaysUntil === undefined
      ? fallback
      : formatMessage(copy.daysRemainingValue, {
          value: formatNumber(network.halving.estimatedDaysUntil, locale),
        });
  const progressText =
    network?.halving.progressPercent === null || network?.halving.progressPercent === undefined
      ? fallback
      : formatMessage(copy.progressValue, {
          value: formatPercentValue(network.halving.progressPercent, locale),
        });
  const nextHalvingHeight =
    network?.halving.nextHalvingHeight === null || network?.halving.nextHalvingHeight === undefined
      ? fallback
      : formatNumber(network.halving.nextHalvingHeight, locale);
  const rewardChange =
    network?.halving.currentReward === null ||
    network?.halving.currentReward === undefined ||
    network?.halving.nextReward === null ||
    network?.halving.nextReward === undefined
      ? fallback
      : `${formatRewardValue(network.halving.currentReward, locale, fallback)} -> ${formatRewardValue(network.halving.nextReward, locale, fallback)}`;

  return (
    <Card as="section" tone="default" padding="md" gap="md" className="overflow-hidden">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        meta={<DataStateMeta state={halvingState} />}
      />

      <DataState
        state={halvingState}
        onRetry={onRetry}
        retryBusy={halvingState.isLoading}
        messages={stateMessages}
      >
        <div
          className="overflow-hidden border border-border-subtle/90 px-4 py-4 sm:px-6 sm:py-5"
          style={{
            background:
              "radial-gradient(circle at top left, color-mix(in srgb, var(--token-color-accent-primary) 14%, transparent), color-mix(in srgb, var(--token-color-accent-primary) 2%, transparent) 30%, transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--token-color-bg-elevated) 92%, black 8%), color-mix(in srgb, var(--token-color-bg-app) 94%, black 6%))",
          }}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <MetaText
                size="xs"
                className="font-mono uppercase tracking-[0.24em] text-fg-secondary"
              >
                {copy.countdownLabel}
              </MetaText>
              <MetaText size="base" className="font-mono text-fg-secondary sm:text-right">
                {formatApproxMonthYear(network?.halving.estimatedDate ?? null, locale, fallback)}
              </MetaText>
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-numeric tabular-nums text-[2.55rem] font-medium leading-[0.95] tracking-[-0.065em] text-fg sm:text-[4.25rem]">
                {blocksRemaining}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <MetaText className="font-mono uppercase tracking-[0.14em] text-accent-strong">
                  {daysRemaining}
                </MetaText>
                <MetaText>{formatDate(network?.halving.estimatedDate ?? null, locale)}</MetaText>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-2.5 overflow-hidden rounded-full bg-border-subtle">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, network?.halving.progressPercent ?? 0))}%`,
                  }}
                />
              </div>
              <div className="text-center">
                <MetaText className="font-mono text-accent-strong">{progressText}</MetaText>
              </div>
            </div>

            <div className="grid gap-4 border-t border-border-subtle/80 pt-4 sm:grid-cols-2">
              <HalvingMetaStat
                label={copy.currentBlockLabel}
                value={
                  network?.latestBlockHeight === null || network?.latestBlockHeight === undefined
                    ? fallback
                    : formatNumber(network.latestBlockHeight, locale)
                }
              />
              <HalvingMetaStat label={copy.rewardChangeLabel} value={rewardChange} align="right" />
              <div className="sm:col-span-2">
                <HalvingMetaStat label={copy.nextHalvingLabel} value={nextHalvingHeight} />
              </div>
            </div>
          </div>
        </div>
      </DataState>
    </Card>
  );
}
