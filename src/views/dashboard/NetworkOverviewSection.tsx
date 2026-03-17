import AsyncContent from "../../components/AsyncContent";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import { FALLBACK_TEXT, formatNumber } from "../../lib/format";
import type { Network } from "../../types/dashboard";

type NetworkOverviewSectionProps = {
  network: Network | null;
  networkError: string;
  networkLoading: boolean;
  showNetworkSkeleton: boolean;
  onRetry: () => void;
};

function formatFee(value: number | null) {
  return `${formatNumber(value)} sat/vB`;
}

export default function NetworkOverviewSection({
  network,
  networkError,
  networkLoading,
  showNetworkSkeleton,
  onRetry,
}: NetworkOverviewSectionProps) {
  if (!network) {
    return (
      <AsyncContent
        error={networkError}
        hasContent={false}
        loading={showNetworkSkeleton || networkLoading}
        loadingMessage="Blockhohe und Fee-Schatzungen werden aktualisiert."
        loadingTitle="Netzwerkdaten werden geladen"
        onAction={onRetry}
        unavailableMessage={networkError}
        unavailableTitle="Netzwerkdaten vorubergehend nicht verfugbar"
      >
        {null}
      </AsyncContent>
    );
  }

  return (
    <Card as="section" className="gap-5">
      <SectionHeader
        eyebrow="Netzwerk"
        title="On-Chain Signale"
        description="Blockhoehe und aktuelle Fee-Schaetzungen in derselben Shell wie die Markt-KPIs."
      />

      <AsyncContent
        error={networkError}
        hasContent
        loading={showNetworkSkeleton || networkLoading}
        loadingMessage="Blockhohe und Fee-Schatzungen werden aktualisiert."
        loadingTitle="Netzwerkdaten werden geladen"
        onAction={onRetry}
        preserveContentOnError
        unavailableMessage="Letzte Netzwerkdaten werden angezeigt. Live-Daten sind gerade nicht verfugbar."
        unavailableTitle="Netzwerkdaten vorubergehend nicht verfugbar"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Letzte Blockhohe"
            value={
              network.latestBlockHeight === null
                ? FALLBACK_TEXT
                : formatNumber(network.latestBlockHeight)
            }
          />

          <MetricCard label="Fastest Fee" value={formatFee(network.fees.fastestFee)} />
          <MetricCard label="Half Hour Fee" value={formatFee(network.fees.halfHourFee)} />
          <MetricCard label="Hour Fee" value={formatFee(network.fees.hourFee)} />
        </div>
      </AsyncContent>
    </Card>
  );
}
