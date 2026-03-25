"use client";

import type { ReactNode } from "react";
import type { AsyncDataState } from "../../lib/data-state";
import type { OnChainActivity } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatCompactNumber, formatCurrency, formatPercent } from "../../lib/format";
import { useI18n } from "../../i18n/context";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import MetaText from "../../components/ui/content/MetaText";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import SectionHeader from "../../components/ui/layout/SectionHeader";

type OnChainActivitySectionProps = {
  onChainActivity: OnChainActivity | null;
  onChainActivityState: AsyncDataState<OnChainActivity>;
  onRetry: () => void;
};

function formatRatio(value: number | null, locale: "de" | "en") {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  return `${formatted}x`;
}

function getValueTone(value: number | null) {
  if (typeof value !== "number") return "default" as const;
  if (value > 0) return "positive" as const;
  if (value < 0) return "negative" as const;
  return "default" as const;
}

function ActivityGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-md border border-border-subtle/85 bg-surface px-4 py-4 sm:px-5 sm:py-5">
      <MetaText size="xs" className="font-mono uppercase tracking-[0.2em]">
        {title}
      </MetaText>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export default function OnChainActivitySection({
  onChainActivity,
  onChainActivityState,
  onRetry,
}: OnChainActivitySectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.onChainActivity;
  const stateMessages = getDashboardSectionStateMessages(
    "onChainActivity",
    onChainActivityState.error,
    locale
  );

  return (
    <Card as="section" tone="default" padding="md" gap="md" className="overflow-hidden">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        meta={<DataStateMeta state={onChainActivityState} />}
      />

      <DataState
        state={onChainActivityState}
        onRetry={onRetry}
        retryBusy={onChainActivityState.isLoading}
        messages={stateMessages}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <ActivityGroup title={copy.groups.usage}>
            <MetricCard
              label={copy.activeAddressesLabel}
              value={formatCompactNumber(onChainActivity?.activeAddresses.current ?? null, locale)}
              meta={copy.activeAddressesMeta}
              valueFootnote={copy.activeAddressesFootnote}
              tone="default"
            />
            <MetricCard
              label={copy.activeAddressesChangeLabel}
              value={formatPercent(
                onChainActivity?.activeAddresses.change7dPercent ?? null,
                locale
              )}
              meta={copy.activeAddressesChangeMeta}
              valueFootnote={copy.activeAddressesChangeFootnote}
              valueTone={getValueTone(onChainActivity?.activeAddresses.change7dPercent ?? null)}
            />
            <MetricCard
              label={copy.transactionCountLabel}
              value={formatCompactNumber(onChainActivity?.transactionCount.current ?? null, locale)}
              meta={copy.transactionCountMeta}
              valueFootnote={copy.transactionCountFootnote}
              tone="default"
            />
            <MetricCard
              label={copy.transactionCountChangeLabel}
              value={formatPercent(
                onChainActivity?.transactionCount.change7dPercent ?? null,
                locale
              )}
              meta={copy.transactionCountChangeMeta}
              valueFootnote={copy.transactionCountChangeFootnote}
              valueTone={getValueTone(onChainActivity?.transactionCount.change7dPercent ?? null)}
            />
          </ActivityGroup>

          <ActivityGroup title={copy.groups.transfers}>
            <MetricCard
              label={copy.transferCountLabel}
              value={formatCompactNumber(onChainActivity?.transferCount.current ?? null, locale)}
              meta={copy.transferCountMeta}
              valueFootnote={copy.transferCountFootnote}
              tone="default"
            />
            <MetricCard
              label={copy.transfersPerTransactionLabel}
              value={formatRatio(onChainActivity?.derived.transfersPerTransaction ?? null, locale)}
              meta={copy.transfersPerTransactionMeta}
              valueFootnote={copy.transfersPerTransactionFootnote}
              tone="default"
            />
          </ActivityGroup>

          <ActivityGroup title={copy.groups.holders}>
            <MetricCard
              label={copy.nonZeroAddressesLabel}
              value={formatCompactNumber(onChainActivity?.nonZeroAddresses.current ?? null, locale)}
              meta={copy.nonZeroAddressesMeta}
              valueFootnote={copy.nonZeroAddressesFootnote}
            />
            <MetricCard
              label={copy.nonZeroAddressesChangeLabel}
              value={formatPercent(
                onChainActivity?.derived.nonZeroAddressesChange7dPercent ?? null,
                locale
              )}
              meta={copy.nonZeroAddressesChangeMeta}
              valueFootnote={copy.nonZeroAddressesChangeFootnote}
              valueTone={getValueTone(
                onChainActivity?.derived.nonZeroAddressesChange7dPercent ?? null
              )}
            />
          </ActivityGroup>

          <ActivityGroup title={copy.groups.fees}>
            <MetricCard
              label={copy.dailyFeesLabel}
              value={formatCurrency(onChainActivity?.dailyFeesBtc.current ?? null, "btc", locale)}
              meta={copy.dailyFeesMeta}
              valueFootnote={copy.dailyFeesFootnote}
              tone="default"
            />
            <MetricCard
              label={copy.dailyFeesAverage7dLabel}
              value={formatCurrency(
                onChainActivity?.derived.averageDailyFees7dBtc ?? null,
                "btc",
                locale
              )}
              meta={copy.dailyFeesAverage7dMeta}
              valueFootnote={copy.dailyFeesAverage7dFootnote}
              tone="default"
            />
          </ActivityGroup>
        </div>
      </DataState>
    </Card>
  );
}
