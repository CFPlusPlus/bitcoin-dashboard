"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Network } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatNumber } from "../../lib/format";
import { useI18n } from "../../i18n/context";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import SectionHeader from "../../components/ui/layout/SectionHeader";

type NetworkOverviewSectionProps = {
  network: Network | null;
  networkState: AsyncDataState<Network>;
  onRetry: () => void;
};

export default function NetworkOverviewSection({
  network,
  networkState,
  onRetry,
}: NetworkOverviewSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.network;
  const fallback = messages.common.unavailable;
  const stateMessages = getDashboardSectionStateMessages("network", networkState.error, locale);
  const formatFee = (value: number | null) => `${formatNumber(value, locale)} sat/vB`;

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
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label={copy.latestBlock}
            value={
              network?.latestBlockHeight === null || network?.latestBlockHeight === undefined
                ? fallback
                : formatNumber(network.latestBlockHeight, locale)
            }
            meta={copy.latestBlockMeta}
            valueFootnote={copy.latestBlockFootnote}
          />
          <MetricCard
            label={copy.fastestFee}
            value={formatFee(network?.fees.fastestFee ?? null)}
            meta={copy.fastestFeeMeta}
            valueFootnote={copy.fastestFeeFootnote}
          />
          <MetricCard
            label={copy.halfHourFee}
            value={formatFee(network?.fees.halfHourFee ?? null)}
            meta={copy.halfHourFeeMeta}
            valueFootnote={copy.halfHourFeeFootnote}
          />
          <MetricCard
            label={copy.hourFee}
            value={formatFee(network?.fees.hourFee ?? null)}
            meta={copy.hourFeeMeta}
            valueFootnote={copy.hourFeeFootnote}
          />
        </div>
      </DataState>
    </Card>
  );
}
