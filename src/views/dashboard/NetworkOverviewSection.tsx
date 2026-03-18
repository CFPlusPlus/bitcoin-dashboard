import type { AsyncDataState } from "../../lib/data-state";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { FALLBACK_TEXT, formatNumber } from "../../lib/format";
import type { Network } from "../../types/dashboard";
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

function formatFee(value: number | null) {
  return `${formatNumber(value)} sat/vB`;
}

export default function NetworkOverviewSection({
  network,
  networkState,
  onRetry,
}: NetworkOverviewSectionProps) {
  const stateMessages = getDashboardSectionStateMessages("network", networkState.error);

  return (
    <Card as="section" tone="muted" padding="md" className="gap-4 border-border-default/80">
      <SectionHeader
        eyebrow="Netzwerk"
        title="Bitcoin im Netzwerk"
        description="Block und Fees zeigen, wie entspannt oder voll das Netzwerk gerade ist."
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
            label="Letzter Block"
            value={
              network?.latestBlockHeight === null || network?.latestBlockHeight === undefined
                ? FALLBACK_TEXT
                : formatNumber(network.latestBlockHeight)
            }
            meta="Zuletzt gesehene Blockhöhe."
            valueFootnote="Steigt fortlaufend, wenn das Netzwerk sauber weiterläuft."
          />

          <MetricCard
            label="Prioritäts-Fee"
            value={formatFee(network?.fees.fastestFee ?? null)}
            meta="Fee für schnelle Bestätigung."
            valueFootnote="Sinnvoll, wenn es möglichst bald durchgehen soll."
          />
          <MetricCard
            label="Fee in ca. 30 Minuten"
            value={formatFee(network?.fees.halfHourFee ?? null)}
            meta="Fee mit etwas Zeitpuffer."
            valueFootnote="Gut für Zahlungen, die bald ankommen sollen."
          />
          <MetricCard
            label="Fee in ca. 60 Minuten"
            value={formatFee(network?.fees.hourFee ?? null)}
            meta="Niedrigere Fee mit mehr Geduld."
            valueFootnote="Praktisch, wenn Kosten vor Tempo gehen."
          />
        </div>
      </DataState>
    </Card>
  );
}
