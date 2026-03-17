import AsyncContent from "../../components/AsyncContent";
import MetricCard from "../../components/MetricCard";
import { formatCurrency, formatPercent } from "../../lib/format";
import type { Currency, Overview } from "../../types/dashboard";

type MarketOverviewSectionProps = {
  currency: Currency;
  overview: Overview | null;
  overviewError: string;
  overviewLoading: boolean;
  showOverviewSkeleton: boolean;
  onRetry: () => void;
};

export default function MarketOverviewSection({
  currency,
  overview,
  overviewError,
  overviewLoading,
  showOverviewSkeleton,
  onRetry,
}: MarketOverviewSectionProps) {
  if (!overview) {
    return (
      <AsyncContent
        error={overviewError}
        hasContent={false}
        loading={showOverviewSkeleton || overviewLoading}
        loadingMessage="Preis, Volumen und Market Cap werden aktualisiert."
        loadingTitle="Marktdaten werden geladen"
        onAction={onRetry}
        stateClassName="col-span-full"
        unavailableMessage={overviewError}
        unavailableTitle="Marktdaten vorubergehend nicht verfugbar"
      >
        {null}
      </AsyncContent>
    );
  }

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
    <AsyncContent
      error={overviewError}
      hasContent
      loading={showOverviewSkeleton || overviewLoading}
      loadingMessage="Preis, Volumen und Market Cap werden aktualisiert."
      loadingTitle="Marktdaten werden geladen"
      onAction={onRetry}
      preserveContentOnError
      stateClassName="col-span-full"
      unavailableMessage="Letzte Marktdaten werden angezeigt. Live-Daten sind gerade nicht verfugbar."
      unavailableTitle="Marktdaten vorubergehend nicht verfugbar"
    >
      <>
        <MetricCard
          label={`BTC Preis (${currencyLabel})`}
          value={formatCurrency(selectedPrice, currency)}
        />

        <MetricCard
          label={`24h Anderung (${currencyLabel})`}
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
    </AsyncContent>
  );
}
