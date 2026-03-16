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
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch("/api/overview")
      .then((res) => {
        if (!res.ok) {
          throw new Error("API konnte nicht geladen werden");
        }
        return res.json() as Promise<Overview>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <p className="eyebrow">MVP</p>
          <h1>Bitcoin Dashboard</h1>
          <p className="subtitle">
            Erste echte Marktdaten über CoinGecko und Cloudflare Pages Functions.
          </p>
        </header>

        {error && <div className="card error">Fehler: {error}</div>}
        {!error && !data && <div className="card">Lade Daten…</div>}

        {data && (
          <section className="grid">
            <article className="card">
              <p className="label">BTC Preis (USD)</p>
              <h2>{formatCurrency(data.priceUsd, "en-US", "USD")}</h2>
            </article>

            <article className="card">
              <p className="label">BTC Preis (EUR)</p>
              <h2>{formatCurrency(data.priceEur, "de-DE", "EUR")}</h2>
            </article>

            <article className="card">
              <p className="label">24h Änderung (USD)</p>
              <h2>{formatPercent(data.change24hUsd)}</h2>
            </article>

            <article className="card">
              <p className="label">24h Volumen (USD)</p>
              <h2>{formatCurrency(data.volume24hUsd, "en-US", "USD")}</h2>
            </article>

            <article className="card">
              <p className="label">Market Cap (USD)</p>
              <h2>{formatCurrency(data.marketCapUsd, "en-US", "USD")}</h2>
            </article>

            <article className="card card-wide">
              <p className="label">Metadaten</p>
              <h2>{data.name}</h2>
              <p className="muted">Quelle: {data.source}</p>
              <p className="muted">
                CoinGecko lastUpdatedAt:{" "}
                {data.lastUpdatedAt
                  ? new Date(data.lastUpdatedAt).toLocaleString("de-DE")
                  : "–"}
              </p>
              <p className="muted">
                Function fetchedAt:{" "}
                {new Date(data.fetchedAt).toLocaleString("de-DE")}
              </p>
            </article>
          </section>
        )}
      </div>
    </main>
  );
}