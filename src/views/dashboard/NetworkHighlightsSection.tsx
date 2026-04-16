"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Network } from "../../types/dashboard";
import { useI18n } from "../../i18n/context";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { formatCompactNumber, formatNumber } from "../../lib/format";
import Card from "../../components/ui/Card";
import Label from "../../components/ui/content/Label";
import MetaText from "../../components/ui/content/MetaText";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";

type NetworkHighlightsSectionProps = {
  network: Network | null;
  networkState: AsyncDataState<Network>;
  onRetry: () => void;
};

function formatFeeValue(value: number | null, locale: "de" | "en", fallback: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  const numberLocale = locale === "de" ? "de-DE" : "en-US";

  return `${new Intl.NumberFormat(numberLocale, {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)} sat/vB`;
}

function formatHashrateValue(value: number | null, locale: "de" | "en", fallback: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  const numberLocale = locale === "de" ? "de-DE" : "en-US";

  return `${new Intl.NumberFormat(numberLocale, {
    maximumFractionDigits: value < 100 ? 1 : 0,
  }).format(value)} EH/s`;
}

function HighlightTile({ label, meta, value }: { label: string; meta?: string; value: string }) {
  return (
    <div className="flex min-h-[7rem] flex-col gap-2 rounded-md border border-border-subtle bg-surface px-4 py-4">
      <Label tone="muted">{label}</Label>
      <p className="font-numeric text-[clamp(1.4rem,3.4vw,1.9rem)] font-medium leading-[0.95] tracking-[-0.04em] text-fg">
        {value}
      </p>
      {meta ? <MetaText>{meta}</MetaText> : null}
    </div>
  );
}

export default function NetworkHighlightsSection({
  network,
  networkState,
  onRetry,
}: NetworkHighlightsSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.network;
  const fallback = messages.common.unavailable;
  const stateMessages = getDashboardSectionStateMessages("network", networkState.error, locale);

  return (
    <Card as="section" tone="default" padding="md" gap="md" className="border-border-default">
      <DataState
        state={networkState}
        onRetry={onRetry}
        retryBusy={networkState.isLoading}
        messages={stateMessages}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-4">
          <div>
            <Label tone="accent">{copy.statsCardTitle}</Label>
            <p className="mt-2 max-w-2xl text-sm text-fg-secondary">{copy.description}</p>
          </div>
          <DataStateMeta state={networkState} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <HighlightTile
            label={copy.latestBlock}
            value={
              network?.latestBlockHeight === null || network?.latestBlockHeight === undefined
                ? fallback
                : `#${formatNumber(network.latestBlockHeight, locale)}`
            }
            meta={copy.latestBlockFootnote}
          />
          <HighlightTile
            label={copy.priorityFeeLabel}
            value={formatFeeValue(network?.fees.fastestFee ?? null, locale, fallback)}
            meta={copy.fastestFeeFootnote}
          />
          <HighlightTile
            label={copy.hashrateCurrentLabel}
            value={formatHashrateValue(
              network?.hashrate.currentEhPerSecond ?? null,
              locale,
              fallback
            )}
            meta={
              network?.hashrate.changePercent30d === null ||
              network?.hashrate.changePercent30d === undefined
                ? copy.hashrateAverageLabel
                : `${copy.hashrateAverageLabel}: ${formatHashrateValue(
                    network.hashrate.stats.average30d,
                    locale,
                    fallback
                  )}`
            }
          />
          <HighlightTile
            label={copy.difficultyCurrentLabel}
            value={
              network?.difficulty.current === null || network?.difficulty.current === undefined
                ? fallback
                : `${formatCompactNumber(network.difficulty.current / 1e12, locale, 1)} T`
            }
            meta={copy.retargetLabel}
          />
          <HighlightTile
            label={copy.pendingTransactionsLabel}
            value={formatCompactNumber(network?.mempool.pendingTransactions ?? null, locale)}
            meta={copy.backlogBlocksMetaSafe}
          />
        </div>
      </DataState>
    </Card>
  );
}
