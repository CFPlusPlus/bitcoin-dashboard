import { FALLBACK_TEXT, formatNumber } from "../../lib/format";
import type { Network } from "../../types/dashboard";
import MetricCard from "../../components/MetricCard";

type NetworkOverviewSectionProps = {
  network: Network;
};

function formatFee(value: number | null) {
  return `${formatNumber(value)} sat/vB`;
}

export default function NetworkOverviewSection({
  network,
}: NetworkOverviewSectionProps) {
  return (
    <>
      <MetricCard
        label="Letzte Blockhöhe"
        value={
          network.latestBlockHeight === null
            ? FALLBACK_TEXT
            : formatNumber(network.latestBlockHeight)
        }
      />

      <MetricCard label="Fastest Fee" value={formatFee(network.fees.fastestFee)} />
      <MetricCard label="Half Hour Fee" value={formatFee(network.fees.halfHourFee)} />
      <MetricCard label="Hour Fee" value={formatFee(network.fees.hourFee)} />
    </>
  );
}
