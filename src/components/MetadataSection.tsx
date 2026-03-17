import { formatDateTime, FALLBACK_TEXT } from "../lib/format";
import type { ChartData, Currency, Network, Overview, Sentiment } from "../types/dashboard";

type MetadataSectionProps = {
  chart: ChartData | null;
  currency: Currency;
  network: Network | null;
  overview: Overview | null;
  sentiment: Sentiment | null;
};

export default function MetadataSection({
  chart,
  currency,
  network,
  overview,
  sentiment,
}: MetadataSectionProps) {
  return (
    <article className="card card-wide">
      <p className="label">Metadaten</p>
      <h2>{overview?.name ?? "Bitcoin"}</h2>
      <p className="muted">Aktive Währung: {currency.toUpperCase()}</p>
      <p className="muted">Market source: {overview?.source ?? FALLBACK_TEXT}</p>
      <p className="muted">Network source: {network?.source ?? FALLBACK_TEXT}</p>
      <p className="muted">Sentiment source: {sentiment?.source ?? FALLBACK_TEXT}</p>
      <p className="muted">Chart source: {chart?.source ?? FALLBACK_TEXT}</p>
      <p className="muted">CoinGecko lastUpdatedAt: {formatDateTime(overview?.lastUpdatedAt ?? null)}</p>
      <p className="muted">Network fetchedAt: {formatDateTime(network?.fetchedAt ?? null)}</p>
      <p className="muted">Sentiment fetchedAt: {formatDateTime(sentiment?.fetchedAt ?? null)}</p>
      <p className="muted">Chart fetchedAt: {formatDateTime(chart?.fetchedAt ?? null)}</p>
    </article>
  );
}
