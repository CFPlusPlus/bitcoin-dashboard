import { useEffect, useState } from "react";

type Overview = {
  name: string;
  btcPriceUsd: number;
  btcPriceEur: number;
  change24h: number;
  source: string;
  updatedAt: string;
};

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
            Erste lokale Version mit React und Cloudflare Pages Functions.
          </p>
        </header>

        {error && <div className="card error">Fehler: {error}</div>}

        {!error && !data && <div className="card">Lade Daten…</div>}

        {data && (
          <section className="grid">
            <article className="card">
              <p className="label">BTC Preis (USD)</p>
              <h2>${data.btcPriceUsd.toLocaleString("en-US")}</h2>
            </article>

            <article className="card">
              <p className="label">BTC Preis (EUR)</p>
              <h2>€{data.btcPriceEur.toLocaleString("de-DE")}</h2>
            </article>

            <article className="card">
              <p className="label">24h Änderung</p>
              <h2>{data.change24h.toFixed(2)}%</h2>
            </article>

            <article className="card">
              <p className="label">Quelle</p>
              <h2>{data.source}</h2>
            </article>

            <article className="card card-wide">
              <p className="label">Projekt</p>
              <h2>{data.name}</h2>
              <p className="muted">
                Aktualisiert: {new Date(data.updatedAt).toLocaleString("de-DE")}
              </p>
            </article>
          </section>
        )}
      </div>
    </main>
  );
}