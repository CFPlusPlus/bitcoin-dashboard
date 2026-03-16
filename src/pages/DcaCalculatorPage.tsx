import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJson } from "../lib/api";
import { buildDcaView } from "../lib/dca";
import {
  FALLBACK_TEXT,
  formatBtc,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
} from "../lib/format";
import { usePersistentState } from "../hooks/usePersistentState";
import type { Currency, DcaEntry, DcaEntryStore, Overview } from "../types/dashboard";

const STORAGE_KEYS = {
  currency: "bitcoin-dashboard:currency",
  dcaEntries: "bitcoin-dashboard:dca-entries",
} as const;

const EMPTY_ENTRY_STORE: DcaEntryStore = {
  usd: [],
  eur: [],
};

function isCurrency(value: unknown): value is Currency {
  return value === "usd" || value === "eur";
}

function isDcaEntry(value: unknown): value is DcaEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    typeof entry.note === "string" &&
    typeof entry.amountInvested === "number" &&
    Number.isFinite(entry.amountInvested) &&
    entry.amountInvested > 0 &&
    typeof entry.bitcoinPrice === "number" &&
    Number.isFinite(entry.bitcoinPrice) &&
    entry.bitcoinPrice > 0
  );
}

function isDcaEntryStore(value: unknown): value is DcaEntryStore {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const store = value as Record<string, unknown>;
  return (
    Array.isArray(store.usd) &&
    Array.isArray(store.eur) &&
    store.usd.every(isDcaEntry) &&
    store.eur.every(isDcaEntry)
  );
}

function createEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getCurrentPrice(overview: Overview | null, currency: Currency) {
  if (!overview) return null;
  return currency === "usd" ? overview.priceUsd : overview.priceEur;
}

function getDefaultDate() {
  return new Date().toISOString().slice(0, 10);
}

function getTone(value: number | null) {
  if (value === null || value === 0) return "default";
  return value > 0 ? "positive" : "negative";
}

export default function DcaCalculatorPage() {
  const [currency, setCurrency] = usePersistentState<Currency>(
    STORAGE_KEYS.currency,
    "usd",
    isCurrency
  );
  const [entryStore, setEntryStore] = usePersistentState<DcaEntryStore>(
    STORAGE_KEYS.dcaEntries,
    EMPTY_ENTRY_STORE,
    isDcaEntryStore
  );

  const [overview, setOverview] = useState<Overview | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState("");

  const [date, setDate] = useState(getDefaultDate);
  const [amountInvested, setAmountInvested] = useState("");
  const [bitcoinPrice, setBitcoinPrice] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  const loadMarketOverview = useCallback(async () => {
    setMarketLoading(true);
    setMarketError("");

    try {
      const overviewData = await fetchJson<Overview>("/api/overview");
      setOverview(overviewData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Marktpreis konnte nicht geladen werden.";
      setMarketError(message);
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMarketOverview();
  }, [loadMarketOverview]);

  const entries = entryStore[currency];
  const currentPrice = getCurrentPrice(overview, currency);
  const dcaView = useMemo(() => buildDcaView(entries, currentPrice), [currentPrice, entries]);
  const summaryTone = getTone(dcaView.summary.pnlAbsolute);

  const handleAddEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const parsedAmountInvested = Number(amountInvested.replace(",", "."));
    const parsedBitcoinPrice = Number(bitcoinPrice.replace(",", "."));

    if (!date) {
      setFormError("Bitte ein gültiges Kaufdatum angeben.");
      return;
    }

    if (!Number.isFinite(parsedAmountInvested) || parsedAmountInvested <= 0) {
      setFormError("Bitte einen gültigen Investitionsbetrag größer als 0 eingeben.");
      return;
    }

    if (!Number.isFinite(parsedBitcoinPrice) || parsedBitcoinPrice <= 0) {
      setFormError("Bitte einen gültigen BTC-Preis größer als 0 eingeben.");
      return;
    }

    const newEntry: DcaEntry = {
      id: createEntryId(),
      date,
      amountInvested: parsedAmountInvested,
      bitcoinPrice: parsedBitcoinPrice,
      note: note.trim(),
    };

    setEntryStore((currentStore) => ({
      ...currentStore,
      [currency]: [newEntry, ...currentStore[currency]],
    }));

    setAmountInvested("");
    setBitcoinPrice("");
    setNote("");
    setDate(getDefaultDate());
  };

  const handleRemoveEntry = (entryId: string) => {
    setEntryStore((currentStore) => ({
      ...currentStore,
      [currency]: currentStore[currency].filter((entry) => entry.id !== entryId),
    }));
  };

  const handleClearEntries = () => {
    setEntryStore((currentStore) => ({
      ...currentStore,
      [currency]: [],
    }));
  };

  const pnlClassName =
    summaryTone === "default" ? "muted" : `muted metric-value-${summaryTone}`;
  const pnlValueClassName = summaryTone === "default" ? undefined : `metric-value-${summaryTone}`;

  return (
    <section className="tool-detail-page">
      <header className="section-hero">
        <p className="eyebrow">Tool</p>
        <h2>DCA-Rechner / Durchschnittskaufpreis</h2>
        <p className="subtitle">
          Erfasse wiederkehrende Käufe, berechne deinen durchschnittlichen Einstieg und
          vergleiche ihn mit dem aktuellen Marktpreis in {currency.toUpperCase()}.
        </p>
      </header>

      <div className="card tool-toolbar-card">
        <div className="tool-toolbar-copy">
          <p className="label">Marktdaten</p>
          <h3>Aktueller Referenzpreis</h3>
          <p className="muted">
            {marketLoading
              ? "Lade aktuellen BTC-Preis..."
              : `Marktpreis: ${formatCurrency(currentPrice, currency)} · Stand: ${formatDateTime(
                  overview?.fetchedAt ?? null
                )}`}
          </p>
          {marketError && <p className="muted">Fehler: {marketError}</p>}
        </div>

        <div className="tool-toolbar-actions">
          <div className="range-switcher" role="tablist" aria-label="Tool-Währung">
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

          <button type="button" className="refresh-btn" onClick={() => void loadMarketOverview()}>
            Preis aktualisieren
          </button>
        </div>
      </div>

      <div className="dca-summary-grid">
        <article className="card dca-summary-card">
          <p className="label">Investiert gesamt</p>
          <h3>{formatCurrency(dcaView.summary.totalInvested, currency)}</h3>
        </article>
        <article className="card dca-summary-card">
          <p className="label">BTC gesamt</p>
          <h3>{formatBtc(dcaView.summary.totalBitcoin)}</h3>
        </article>
        <article className="card dca-summary-card">
          <p className="label">Durchschnittskaufpreis</p>
          <h3>
            {dcaView.summary.averageBuyPrice === null
              ? FALLBACK_TEXT
              : `${formatCurrency(dcaView.summary.averageBuyPrice, currency)} / BTC`}
          </h3>
        </article>
        <article className="card dca-summary-card">
          <p className="label">Marktpreis aktuell</p>
          <h3>
            {dcaView.summary.currentPrice === null
              ? FALLBACK_TEXT
              : `${formatCurrency(dcaView.summary.currentPrice, currency)} / BTC`}
          </h3>
        </article>
        <article className="card dca-summary-card">
          <p className="label">Wert heute</p>
          <h3>{formatCurrency(dcaView.summary.currentValue, currency)}</h3>
        </article>
        <article className="card dca-summary-card">
          <p className="label">PnL</p>
          <h3 className={pnlValueClassName}>{formatCurrency(dcaView.summary.pnlAbsolute, currency)}</h3>
          <p className={pnlClassName}>{formatPercent(dcaView.summary.pnlPercent)}</p>
        </article>
      </div>

      <div className="tool-detail-layout dca-layout">
        <article className="card dca-form-card">
          <p className="label">Neuer Kauf</p>
          <h3>DCA-Eintrag hinzufügen</h3>

          <form className="dca-form" onSubmit={handleAddEntry}>
            <label className="input-group">
              <span>Datum</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>

            <label className="input-group">
              <span>Investierter Betrag ({currency.toUpperCase()})</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amountInvested}
                onChange={(event) => setAmountInvested(event.target.value)}
                placeholder={currency === "usd" ? "250" : "200"}
              />
            </label>

            <label className="input-group">
              <span>BTC-Preis beim Kauf ({currency.toUpperCase()})</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={bitcoinPrice}
                onChange={(event) => setBitcoinPrice(event.target.value)}
                placeholder={currency === "usd" ? "50000" : "46000"}
              />
            </label>

            <label className="input-group">
              <span>Notiz</span>
              <input
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="z. B. Monatsrate März"
              />
            </label>

            {formError && <p className="form-error">{formError}</p>}

            <div className="dca-form-actions">
              <button type="submit" className="refresh-btn">
                Kauf hinzufügen
              </button>
              <p className="muted">
                Einträge werden lokal gespeichert. USD- und EUR-Reihen werden getrennt geführt.
              </p>
            </div>
          </form>
        </article>

        <article className="card dca-list-card">
          <div className="dca-list-header">
            <div>
              <p className="label">Kaufhistorie</p>
              <h3>{dcaView.summary.totalEntries} Einträge</h3>
            </div>

            <div className="dca-list-actions">
              <Link className="range-btn tool-back-link" to="/tools">
                Zur Tool-Übersicht
              </Link>
              <button
                type="button"
                className="range-btn"
                onClick={handleClearEntries}
                disabled={entries.length === 0}
              >
                Alles löschen
              </button>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="dca-empty-state">
              <p>Noch keine DCA-Einträge in {currency.toUpperCase()} vorhanden.</p>
              <p className="muted">
                Füge deinen ersten Kauf hinzu, damit der Rechner Durchschnittspreis und
                Performance berechnen kann.
              </p>
            </div>
          ) : (
            <ul className="dca-entry-list">
              {dcaView.items.map((entry) => (
                <li key={entry.id} className="dca-entry-row">
                  <div className="dca-entry-main">
                    <div className="dca-entry-topline">
                      <strong>{formatDate(entry.date)}</strong>
                      {entry.note ? <span className="dca-entry-note">{entry.note}</span> : null}
                    </div>
                    <div className="dca-entry-metrics">
                      <span>Investiert: {formatCurrency(entry.amountInvested, currency)}</span>
                      <span>
                        Kaufpreis: {formatCurrency(entry.bitcoinPrice, currency)} / BTC
                      </span>
                      <span>BTC erhalten: {formatBtc(entry.bitcoinAmount)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveEntry(entry.id)}
                  >
                    Entfernen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
