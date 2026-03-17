import { formatCurrency, formatPercent } from "../../lib/format";
import type { Currency, Overview } from "../../types/dashboard";
import MetricCard from "../../components/MetricCard";

type MarketOverviewSectionProps = {
  currency: Currency;
  overview: Overview;
};

export default function MarketOverviewSection({
  currency,
  overview,
}: MarketOverviewSectionProps) {
  const currencyLabel = currency.toUpperCase();
  const selectedPrice = currency === "usd" ? overview.priceUsd : overview.priceEur;
  const selectedChange24h =
    currency === "usd" ? overview.change24hUsd : overview.change24hEur;
  const selectedVolume24h =
    currency === "usd" ? overview.volume24hUsd : overview.volume24hEur;
  const selectedMarketCap =
    currency === "usd" ? overview.marketCapUsd : overview.marketCapEur;
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
      <MetricCard
        label={`BTC Preis (${currencyLabel})`}
        value={formatCurrency(selectedPrice, currency)}
      />

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
    </>
  );
}
