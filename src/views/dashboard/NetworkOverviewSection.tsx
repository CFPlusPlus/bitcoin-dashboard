import type { AsyncDataState } from "../../lib/data-state";
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
  return (
    <Card as="section" tone="muted" className="gap-5">
      <SectionHeader
        eyebrow="Netzwerk und Blockchain"
        title="Tieferer technischer Kontext"
        description="Blockhoehe und aktuelle Fee-Schaetzungen bleiben erreichbar, treten aber bewusst hinter Marktueberblick, Chart und Stimmung zurueck."
        meta={<DataStateMeta state={networkState} />}
      />

      <DataState
        state={networkState}
        onRetry={onRetry}
        retryBusy={networkState.isLoading}
        messages={{
          loading: {
            title: "Netzwerkdaten werden geladen",
            description: "Blockhoehe und Fee-Schaetzungen werden vorbereitet.",
          },
          empty: {
            title: "Keine Netzwerkdaten verfuegbar",
            description:
              "Der Abruf war erfolgreich, liefert aktuell aber keine auswertbaren On-Chain Werte.",
          },
          error: {
            title: "Netzwerkdaten sind gerade nicht verfuegbar",
            description:
              networkState.error ??
              "Es konnten noch keine verlaesslichen Netzwerkdaten geladen werden.",
          },
          partial: {
            title: "Netzwerkdaten sind teilweise verfuegbar",
            description:
              "Einzelne On-Chain Werte fehlen im aktuellen Abruf. Verfuegbare Kennzahlen bleiben sichtbar.",
          },
          stale: {
            title: "Letzte Netzwerkdaten bleiben sichtbar",
            description:
              "Die Aktualisierung hat nicht alle Werte erneuert. Die angezeigten Angaben koennen inzwischen veraltet sein.",
          },
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Letzte Blockhohe"
            value={
              network?.latestBlockHeight === null || network?.latestBlockHeight === undefined
                ? FALLBACK_TEXT
                : formatNumber(network.latestBlockHeight)
            }
          />

          <MetricCard label="Fastest Fee" value={formatFee(network?.fees.fastestFee ?? null)} />
          <MetricCard label="Half Hour Fee" value={formatFee(network?.fees.halfHourFee ?? null)} />
          <MetricCard label="Hour Fee" value={formatFee(network?.fees.hourFee ?? null)} />
        </div>
      </DataState>
    </Card>
  );
}
