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
        description="Hier folgen die tieferen Betriebsdaten fuer den naechsten Block und die aktuelle Fee-Lage im Netzwerk."
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
            label="Neuester Block"
            value={
              network?.latestBlockHeight === null || network?.latestBlockHeight === undefined
                ? FALLBACK_TEXT
                : formatNumber(network.latestBlockHeight)
            }
          />

          <MetricCard
            label="Schnelle Bestaetigung"
            value={formatFee(network?.fees.fastestFee ?? null)}
          />
          <MetricCard
            label="Etwa 30 Minuten"
            value={formatFee(network?.fees.halfHourFee ?? null)}
          />
          <MetricCard
            label="Etwa 60 Minuten"
            value={formatFee(network?.fees.hourFee ?? null)}
          />
        </div>
      </DataState>
    </Card>
  );
}
