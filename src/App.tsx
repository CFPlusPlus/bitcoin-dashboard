import { useEffect, useState } from "react";
import PriceChart from "./components/PriceChart";

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

type ChartRange = 1 | 7 | 30;

type ChartData = {
  source: string;
  currency: "usd";
  range: ChartRange;
  points: Array<{
    timestamp: number;
    price: number;
  }>;
  stats: {
    currentPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
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
  const [chart, setChart] = useState<ChartData | null>(null);
  const [range, setRange] = useState<ChartRange>(1);

  const [baseError, setBaseError] = useState<string>("");
  const [chartError, setChartError] = useState<string>("");
  const [chartLoading, setChartLoading] = useState<boolean>(false);

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
      .catch((err: Error) => setBaseError(err.message));
  }, []);

  useEffect(() => {
    setChartLoading(true);
    setChartError("");

    fetch(`/api/chart?days=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error("Chart konnte nicht geladen werden");
        return res.json() as Promise<ChartData>;
      })
      .then(setChart)
      .catch((err: Error) => setChartError(err.message))
      .finally(() => setChartLoading(false));
  }, [range]);

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

        {baseError && <div className="card error">Fehler: {baseError}</div>}
        {!baseError && (!overview || !network) && (
          <div className="card">Lade Basisdaten…</div>
        )}

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
              <div className="chart-header">
                <div>
                  <p className="label">BTC Preisverlauf (USD)</p>
                  <h2>Chart</h2>
                </div>

                <div className="range-switcher" role="tablist" aria-label="Zeitraum">
                  {[1, 7, 30].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={range === value ? "range-btn active" : "range-btn"}
                      onClick={() => setRange(value as ChartRange)}
                    >
                      {value === 1 ? "1D" : `${value}D`}
                    </button>
                  ))}
                </div>
              </div>

              {chartError && <div className="chart-empty">Fehler: {chartError}</div>}
              {!chartError && chartLoading && (
                <div className="chart-empty">Lade Chartdaten…</div>
              )}
              {!chartError && !chartLoading && chart && (
                <PriceChart points={chart.points} range={chart.range} />
              )}
            </article>

            <article className="card card-wide">
              <p className="label">Metadaten</p>
              <h2>{overview.name}</h2>
              <p className="muted">Market source: {overview.source}</p>
              <p className="muted">Network source: {network.source}</p>
              <p className="muted">Chart source: {chart?.source ?? "–"}</p>
              <p className="muted">
                CoinGecko lastUpdatedAt:{" "}
                {overview.lastUpdatedAt
                  ? new Date(overview.lastUpdatedAt).toLocaleString("de-DE")
                  : "–"}
              </p>
              <p className="muted">
                Network fetchedAt: {new Date(network.fetchedAt).toLocaleString("de-DE")}
              </p>
              <p className="muted">
                Chart fetchedAt:{" "}
                {chart ? new Date(chart.fetchedAt).toLocaleString("de-DE") : "–"}
              </p>
            </article>
          </section>
        )}
      </div>
    </main>
  );
}