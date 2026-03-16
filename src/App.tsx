import { useCallback, useEffect, useRef, useState } from "react";
import PriceChart from "./components/PriceChart";

type Currency = "usd" | "eur";
type ChartRange = 1 | 7 | 30;

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

type ChartData = {
  source: string;
  currency: Currency;
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

function formatCurrency(value: number | null, currency: Currency) {
  if (value === null) return "–";

  return new Intl.NumberFormat(currency === "usd" ? "en-US" : "de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return "–";
  return `${value.toFixed(2)}%`;
}

async function fetchOverview(): Promise<Overview> {
  const res = await fetch("/api/overview");
  if (!res.ok) {
    throw new Error("Overview konnte nicht geladen werden");
  }
  return res.json() as Promise<Overview>;
}

async function fetchNetwork(): Promise<Network> {
  const res = await fetch("/api/network");
  if (!res.ok) {
    throw new Error("Network konnte nicht geladen werden");
  }
  return res.json() as Promise<Network>;
}

async function fetchChart(range: ChartRange, currency: Currency): Promise<ChartData> {
  const res = await fetch(`/api/chart?days=${range}&currency=${currency}`);
  if (!res.ok) {
    throw new Error("Chart konnte nicht geladen werden");
  }
  return res.json() as Promise<ChartData>;
}

export default function App() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);

  const [range, setRange] = useState<ChartRange>(1);
  const [currency, setCurrency] = useState<Currency>("usd");

  const [baseError, setBaseError] = useState<string>("");
  const [chartError, setChartError] = useState<string>("");

  const [baseLoading, setBaseLoading] = useState<boolean>(true);
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

  const initialChartHandledRef = useRef(false);
  const initialRefreshHandledRef = useRef(false);

  const loadBaseData = useCallback(async (): Promise<boolean> => {
    setBaseError("");
    setBaseLoading(true);

    try {
      const [overviewData, networkData] = await Promise.all([
        fetchOverview(),
        fetchNetwork(),
      ]);

      setOverview(overviewData);
      setNetwork(networkData);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Basisdaten konnten nicht geladen werden";
      setBaseError(message);
      return false;
    } finally {
      setBaseLoading(false);
    }
  }, []);

  const loadChartData = useCallback(
    async (selectedRange: ChartRange, selectedCurrency: Currency): Promise<boolean> => {
      setChartError("");
      setChartLoading(true);

      try {
        const chartData = await fetchChart(selectedRange, selectedCurrency);
        setChart(chartData);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Chartdaten konnten nicht geladen werden";
        setChartError(message);
        return false;
      } finally {
        setChartLoading(false);
      }
    },
    []
  );

  const refreshAll = useCallback(
    async (selectedRange: ChartRange, selectedCurrency: Currency) => {
      setRefreshing(true);

      const [baseOk, chartOk] = await Promise.all([
        loadBaseData(),
        loadChartData(selectedRange, selectedCurrency),
      ]);

      if (baseOk && chartOk) {
        setLastRefreshAt(new Date().toISOString());
      }

      setRefreshing(false);
    },
    [loadBaseData, loadChartData]
  );

  useEffect(() => {
    if (initialRefreshHandledRef.current) return;
    initialRefreshHandledRef.current = true;
    void refreshAll(range, currency);
  }, [range, currency, refreshAll]);

  useEffect(() => {
    if (!initialChartHandledRef.current) {
      initialChartHandledRef.current = true;
      return;
    }

    void loadChartData(range, currency);
  }, [range, currency, loadChartData]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshAll(range, currency);
    }, 60_000);

    return () => window.clearInterval(id);
  }, [range, currency, refreshAll]);

  const showBaseSkeleton = !baseError && baseLoading && (!overview || !network);
  const showChartSkeleton = !chartError && chartLoading && !chart;

  const selectedPrice =
    currency === "usd" ? overview?.priceUsd ?? null : overview?.priceEur ?? null;

  const selectedChange24h =
    currency === "usd"
      ? overview?.change24hUsd ?? null
      : overview?.change24hEur ?? null;

  const selectedVolume24h =
    currency === "usd"
      ? overview?.volume24hUsd ?? null
      : overview?.volume24hEur ?? null;

  const selectedMarketCap =
    currency === "usd"
      ? overview?.marketCapUsd ?? null
      : overview?.marketCapEur ?? null;

  const currencyLabel = currency.toUpperCase();

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

        <div className="toolbar">
          <div className="toolbar-info">
            <span className="toolbar-label">Auto-Refresh:</span>
            <span>alle 60 Sekunden</span>
          </div>

          <div className="toolbar-actions">
            <div className="range-switcher" role="tablist" aria-label="Währung">
              {(["usd", "eur"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={currency === value ? "range-btn active" : "range-btn"}
                  onClick={() => setCurrency(value)}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>

            <span className="toolbar-time">
              Zuletzt aktualisiert:{" "}
              {lastRefreshAt
                ? new Date(lastRefreshAt).toLocaleString("de-DE")
                : "–"}
            </span>

            <button
              type="button"
              className="refresh-btn"
              onClick={() => void refreshAll(range, currency)}
              disabled={refreshing}
            >
              {refreshing ? "Aktualisiere…" : "Jetzt aktualisieren"}
            </button>
          </div>
        </div>

        {baseError && <div className="card error">Fehler: {baseError}</div>}
        {showBaseSkeleton && <div className="card">Lade Basisdaten…</div>}

        {overview && network && (
          <section className="grid">
            <article className="card">
              <p className="label">BTC Preis ({currencyLabel})</p>
              <h2>{formatCurrency(selectedPrice, currency)}</h2>
            </article>

            <article className="card">
              <p className="label">24h Änderung ({currencyLabel})</p>
              <h2>{formatPercent(selectedChange24h)}</h2>
            </article>

            <article className="card">
              <p className="label">24h Volumen ({currencyLabel})</p>
              <h2>{formatCurrency(selectedVolume24h, currency)}</h2>
            </article>

            <article className="card">
              <p className="label">Market Cap ({currencyLabel})</p>
              <h2>{formatCurrency(selectedMarketCap, currency)}</h2>
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
                  <p className="label">BTC Preisverlauf ({currencyLabel})</p>
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
              {showChartSkeleton && <div className="chart-empty">Lade Chartdaten…</div>}
              {!chartError && !chartLoading && chart && (
                <PriceChart
                  points={chart.points}
                  range={chart.range}
                  currency={chart.currency}
                />
              )}
            </article>

            <article className="card card-wide">
              <p className="label">Metadaten</p>
              <h2>{overview.name}</h2>
              <p className="muted">Aktive Währung: {currencyLabel}</p>
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