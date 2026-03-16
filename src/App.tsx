import { useEffect, useState } from "react";

type Overview = {
  name: string;
  source: string;
  priceUsd: number | null;
  priceEur: number | null;
  change24hUsd: number | null;
  change24hEur: number | null;
  marketCapUsd: number | null;
  marketCapEur: number | null;
  volume24hUsd: number | null;
  volume24hEur: number | null;
  lastUpdatedAt: string | null;
  fetchedAt: string;
};

type Network = {
  source: string;
  latestBlockHeight: number;
  fees: {
    fastestFee: number | null;
    halfHourFee: number | null;
    hourFee: number | null;
    economyFee: number | null;
    minimumFee: number | null;
  };
  fetchedAt: string;
};

function formatCurrency(value: number | null, locale: string, currency: string) {
  if (value === null) return "–";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return "–";
  return `${value.toFixed(2)}%`;
}

export default function App() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch("/api/overview").then((res) => {
        if (!res.ok) throw new Error("Overview konnte nicht geladen werden");
        return res.json() as Promise<Overview>;
      }),
      fetch("/api/network").then((res) => {
        if (!res.ok) throw new Error("Network konnte nicht geladen werden");
        return res.json() as Promise<Network>;
      }),
    ])
      .then(([overviewData, networkData]) => {
        setOverview(overviewData);
        setNetwork(networkData);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <p className="eyebrow">MVP</p>
          <h1>Bitcoin Dashboard</h1>
          <p className="subtitle">
            Marktdaten über CoinGecko und Netzwerkdaten über mempool.space.
          </p>
        </header>

        {error && <div className="card error">Fehler: {error}</div>}
        {!error && (!overview || !network) && <div className="card">Lade Daten…</div>}

        {overview && network && (
          <section className="grid">
            <article className="card">
              <p className="label">BTC Preis (USD)</p>
              <h2>{formatCurrency(overview.priceUsd, "en-US", "USD")}</h2>
            </article>

            <article className="card">
              <p className="label">BTC Preis (EUR)</p>
              <h2>{formatCurrency(overview.priceEur, "de-DE", "EUR")}</h2>
            </article>

            <article className="card">
              <p className="label">24h Änderung (USD)</p>
              <h2>{formatPercent(overview.change24hUsd)}</h2>
            </article>

            <article className="card">
              <p className="label">24h Volumen (USD)</p>
              <h2>{formatCurrency(overview.volume24hUsd, "en-US", "USD")}</h2>
            </article>

            <article className="card">
              <p className="label">Market Cap (USD)</p>
              <h2>{formatCurrency(overview.marketCapUsd, "en-US", "USD")}</h2>
            </article>

            <article className="card">
              <p className="label">Letzte Blockhöhe</p>
              <h2>{network.latestBlockHeight.toLocaleString("de-DE")}</h2>
            </article>

            <article className="card">
              <p className="label">Fastest Fee</p>
              <h2>{network.fees.fastestFee ?? "–"} sat/vB</h2>
            </article>

            <article className="card">
              <p className="label">Half Hour Fee</p>
              <h2>{network.fees.halfHourFee ?? "–"} sat/vB</h2>
            </article>

            <article className="card">
              <p className="label">Hour Fee</p>
              <h2>{network.fees.hourFee ?? "–"} sat/vB</h2>
            </article>

            <article className="card card-wide">
              <p className="label">Metadaten</p>
              <h2>{overview.name}</h2>
              <p className="muted">Market source: {overview.source}</p>
              <p className="muted">Network source: {network.source}</p>
              <p className="muted">
                CoinGecko lastUpdatedAt:{" "}
                {overview.lastUpdatedAt
                  ? new Date(overview.lastUpdatedAt).toLocaleString("de-DE")
                  : "–"}
              </p>
              <p className="muted">
                Network fetchedAt: {new Date(network.fetchedAt).toLocaleString("de-DE")}
              </p>
            </article>
          </section>
        )}
      </div>
    </main>
  );
}