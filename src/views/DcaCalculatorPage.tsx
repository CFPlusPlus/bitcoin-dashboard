"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AsyncContent from "../components/AsyncContent";
import { usePersistentState } from "../hooks/usePersistentState";
import { fetchJson } from "../lib/api";
import {
  addDcaEntry,
  buildDcaView,
  clearDcaEntries,
  createDcaEntry,
  EMPTY_DCA_ENTRY_STORE,
  getCurrentPrice,
  getDcaTone,
  getDefaultDcaDate,
  isCurrency,
  normalizeDcaEntryStore,
  removeDcaEntry,
} from "../lib/dca";
import {
  FALLBACK_TEXT,
  formatBtc,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
} from "../lib/format";
import type { Currency, DcaEntryStore, Overview } from "../types/dashboard";

const STORAGE_KEYS = {
  currency: "bitcoin-dashboard:currency",
  dcaEntries: "bitcoin-dashboard:dca-entries",
} as const;

export default function DcaCalculatorPage() {
  const currencyStateOptions = useMemo(() => ({ validator: isCurrency }), []);
  const entryStoreStateOptions = useMemo(
    () => ({ normalize: normalizeDcaEntryStore }),
    []
  );

  const [currency, setCurrency] = usePersistentState<Currency>(
    STORAGE_KEYS.currency,
    "usd",
    currencyStateOptions
  );
  const [entryStore, setEntryStore] = usePersistentState<DcaEntryStore>(
    STORAGE_KEYS.dcaEntries,
    EMPTY_DCA_ENTRY_STORE,
    entryStoreStateOptions
  );

  const [overview, setOverview] = useState<Overview | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState("");

  const [date, setDate] = useState("");
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

  useEffect(() => {
    setDate((currentDate) => currentDate || getDefaultDcaDate());
  }, []);

  const entries = entryStore[currency];
  const currentPrice = getCurrentPrice(overview, currency);
  const dcaView = useMemo(() => buildDcaView(entries, currentPrice), [currentPrice, entries]);
  const summaryTone = getDcaTone(dcaView.summary.pnlAbsolute);

  const handleAddEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const result = createDcaEntry({
      amountInvested,
      bitcoinPrice,
      date,
      note,
    });

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setEntryStore((currentStore) => addDcaEntry(currentStore, currency, result.value));

    setAmountInvested("");
    setBitcoinPrice("");
    setNote("");
    setDate(getDefaultDcaDate());
  };

  const handleRemoveEntry = (entryId: string) => {
    setEntryStore((currentStore) => removeDcaEntry(currentStore, currency, entryId));
  };

  const handleClearEntries = () => {
    setEntryStore((currentStore) => clearDcaEntries(currentStore, currency));
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
          Erfasse wiederkehrende Kaufe, berechne deinen durchschnittlichen Einstieg und
          vergleiche ihn mit dem aktuellen Marktpreis in {currency.toUpperCase()}.
        </p>
      </header>

      <div className="card tool-toolbar-card">
        <div className="tool-toolbar-copy">
          <p className="label">Marktdaten</p>
          <h3>Aktueller Referenzpreis</h3>
          <AsyncContent
            error={marketError}
            hasContent={overview !== null}
            loading={marketLoading}
            loadingMessage="Der aktuelle BTC-Preis wird geladen."
            loadingTitle="Referenzpreis wird geladen"
            onAction={() => void loadMarketOverview()}
            preserveContentOnError
            unavailableMessage="Letzter Referenzpreis wird angezeigt. Live-Daten sind gerade nicht verfugbar."
            unavailableTitle="Referenzpreis vorubergehend nicht verfugbar"
          >
            <p className="muted">
              {`Marktpreis: ${formatCurrency(currentPrice, currency)} · Stand: ${formatDateTime(
                overview?.fetchedAt ?? null
              )}`}
            </p>
          </AsyncContent>
        </div>

        <div className="tool-toolbar-actions">
          <div className="range-switcher" role="tablist" aria-label="Tool-Wahrung">
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
          <h3 className={pnlValueClassName}>
            {formatCurrency(dcaView.summary.pnlAbsolute, currency)}
          </h3>
          <p className={pnlClassName}>{formatPercent(dcaView.summary.pnlPercent)}</p>
        </article>
      </div>

      <div className="tool-detail-layout dca-layout">
        <article className="card dca-form-card">
          <p className="label">Neuer Kauf</p>
          <h3>DCA-Eintrag hinzufugen</h3>

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
                placeholder="z. B. Monatsrate Marz"
              />
            </label>

            {formError && <p className="form-error">{formError}</p>}

            <div className="dca-form-actions">
              <button type="submit" className="refresh-btn">
                Kauf hinzufugen
              </button>
              <p className="muted">
                Eintrage werden lokal gespeichert. USD- und EUR-Reihen werden getrennt gefuhrt.
              </p>
            </div>
          </form>
        </article>

        <article className="card dca-list-card">
          <div className="dca-list-header">
            <div>
              <p className="label">Kaufhistorie</p>
              <h3>{dcaView.summary.totalEntries} Eintrage</h3>
            </div>

            <div className="dca-list-actions">
              <Link className="range-btn tool-back-link" href="/tools">
                Zur Tool-Ubersicht
              </Link>
              <button
                type="button"
                className="range-btn"
                onClick={handleClearEntries}
                disabled={entries.length === 0}
              >
                Alles loschen
              </button>
            </div>
          </div>

          {entries.length === 0 ? (
            <AsyncContent
              emptyMessage={`Fuge deinen ersten Kauf in ${currency.toUpperCase()} hinzu, damit der Rechner Durchschnittspreis und Performance berechnen kann.`}
              emptyTitle={`Keine DCA-Eintrage in ${currency.toUpperCase()}`}
              error=""
              hasContent={false}
              isEmpty
              loading={false}
              loadingMessage=""
              loadingTitle=""
              stateClassName="dca-empty-state"
            >
              {null}
            </AsyncContent>
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
