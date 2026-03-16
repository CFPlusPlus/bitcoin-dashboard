import { FALLBACK_TEXT, formatCountdown, formatCurrency, formatNumber, formatPercent } from "../lib/format";
import type { Currency, Network, Overview, Sentiment } from "../types/dashboard";
import MetricCard from "./MetricCard";

type DashboardOverviewSectionProps = {
  currency: Currency;
  network: Network;
  overview: Overview;
  sentiment: Sentiment | null;
  sentimentError: string;
  sentimentLoading: boolean;
  showSentimentSkeleton: boolean;
};

function formatFee(value: number | null) {
  return `${formatNumber(value)} sat/vB`;
}

export default function DashboardOverviewSection({
  currency,
  network,
  overview,
  sentiment,
  sentimentError,
  sentimentLoading,
  showSentimentSkeleton,
}: DashboardOverviewSectionProps) {
  const currencyLabel = currency.toUpperCase();
  const selectedPrice = currency === "usd" ? overview.priceUsd : overview.priceEur;
  const selectedChange24h = currency === "usd" ? overview.change24hUsd : overview.change24hEur;
  const selectedVolume24h = currency === "usd" ? overview.volume24hUsd : overview.volume24hEur;
  const selectedMarketCap = currency === "usd" ? overview.marketCapUsd : overview.marketCapEur;
  const selectedHigh24h = currency === "usd" ? overview.high24hUsd : overview.high24hEur;
  const selectedLow24h = currency === "usd" ? overview.low24hUsd : overview.low24hEur;

  const changeTone =
    typeof selectedChange24h === "number" && selectedChange24h > 0
      ? "positive"
      : typeof selectedChange24h === "number" && selectedChange24h < 0
        ? "negative"
        : "default";

  return (
    <>
      <MetricCard label={`BTC Preis (${currencyLabel})`} value={formatCurrency(selectedPrice, currency)} />

      <MetricCard
        label={`24h Änderung (${currencyLabel})`}
        value={formatPercent(selectedChange24h)}
        valueTone={changeTone}
      />

      <MetricCard
        label={`24h Volumen (${currencyLabel})`}
        value={formatCurrency(selectedVolume24h, currency)}
      />

      <MetricCard
        label={`Market Cap (${currencyLabel})`}
        value={formatCurrency(selectedMarketCap, currency)}
      />

      <article className="card">
        <p className="label">24h High / Low ({currencyLabel})</p>
        <div className="stat-stack">
          <div className="stat-row">
            <span>High</span>
            <strong>{formatCurrency(selectedHigh24h, currency)}</strong>
          </div>
          <div className="stat-row">
            <span>Low</span>
            <strong>{formatCurrency(selectedLow24h, currency)}</strong>
          </div>
        </div>
      </article>

      <MetricCard
        label="Letzte Blockhöhe"
        value={network.latestBlockHeight === null ? FALLBACK_TEXT : formatNumber(network.latestBlockHeight)}
      />

      <MetricCard label="Fastest Fee" value={formatFee(network.fees.fastestFee)} />
      <MetricCard label="Half Hour Fee" value={formatFee(network.fees.halfHourFee)} />
      <MetricCard label="Hour Fee" value={formatFee(network.fees.hourFee)} />

      <article className="card">
        <p className="label">Fear &amp; Greed</p>

        {sentimentError && <p className="muted">Fehler: {sentimentError}</p>}
        {showSentimentSkeleton && <p className="muted">Lade Sentiment...</p>}

        {!sentimentError && !sentimentLoading && sentiment && (
          <>
            <h2>{sentiment.value ?? FALLBACK_TEXT} / 100</h2>
            <p className="muted">{sentiment.classification ?? FALLBACK_TEXT}</p>
            <p className="muted">
              Nächstes Update in: {formatCountdown(sentiment.timeUntilUpdateSeconds)}
            </p>
            <p className="muted">{sentiment.attribution}</p>
          </>
        )}
      </article>
    </>
  );
}
