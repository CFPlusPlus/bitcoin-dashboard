"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataState from "../components/ui/data-state/DataState";
import DataStateMeta from "../components/ui/data-state/DataStateMeta";
import EmptyState from "../components/ui/data-state/EmptyState";
import { usePersistentState } from "../hooks/usePersistentState";
import { fetchJson } from "../lib/api";
import { resolveAsyncDataState } from "../lib/data-state";
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
  formatPercent,
} from "../lib/format";
import type { Currency, DcaEntryStore, Overview } from "../types/dashboard";

const STORAGE_KEYS = {
  currency: "bitcoin-dashboard:currency",
  dcaEntries: "bitcoin-dashboard:dca-entries",
} as const;

type DcaFormField = "amountInvested" | "bitcoinPrice" | "date";

function getPrimaryResultCopy(
  totalEntries: number,
  averageBuyPrice: number | null,
  currency: Currency
) {
  if (totalEntries === 0 || averageBuyPrice === null) {
    return {
      description:
        "Trage deinen ersten Kauf ein. Danach zeigt dir der Rechner automatisch deinen Durchschnittspreis, deinen BTC-Bestand und den Vergleich zum aktuellen Marktpreis.",
      title: "Noch keine Kauefe erfasst",
    };
  }

  return {
    description:
      "Das ist dein durchschnittlicher Einstieg pro Bitcoin auf Basis aller erfassten Kauefe in der aktiven Waehrung.",
    title: `Dein durchschnittlicher Kaufpreis liegt bei ${formatCurrency(averageBuyPrice, currency)} / BTC`,
  };
}

function getPerformanceCopy(
  totalEntries: number,
  pnlAbsolute: number | null,
  pnlPercent: number | null,
  currentValue: number | null,
  currency: Currency
) {
  if (totalEntries === 0) {
    return "Sobald du Kaeufe erfasst hast, erscheint hier eine ruhige Einordnung statt nur einzelner Zahlen.";
  }

  if (currentValue === null || pnlAbsolute === null || pnlPercent === null) {
    return "Deine Kaufhistorie ist gespeichert. Fuer den heutigen Vergleich fehlt gerade nur ein aktueller Referenzpreis.";
  }

  if (pnlAbsolute > 0) {
    return `Beim aktuellen Referenzpreis liegt dein Bestand rund ${formatCurrency(currentValue, currency)} wert und etwa ${formatCurrency(pnlAbsolute, currency)} bzw. ${formatPercent(pnlPercent)} ueber deinem eingesetzten Kapital.`;
  }

  if (pnlAbsolute < 0) {
    return `Beim aktuellen Referenzpreis liegt dein Bestand rund ${formatCurrency(currentValue, currency)} wert und etwa ${formatCurrency(Math.abs(pnlAbsolute), currency)} bzw. ${formatPercent(Math.abs(pnlPercent) * -1)} unter deinem eingesetzten Kapital.`;
  }

  return `Beim aktuellen Referenzpreis entspricht dein Bestand mit rund ${formatCurrency(currentValue, currency)} nahezu deinem eingesetzten Kapital.`;
}

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
  const [formErrorField, setFormErrorField] = useState<DcaFormField | null>(null);
  const formCardRef = useRef<HTMLElement | null>(null);

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
  const marketState = useMemo(
    () =>
      resolveAsyncDataState({
        data: overview,
        error: marketError,
        hasUsableData: currentPrice !== null,
        isEmpty: overview !== null && currentPrice === null,
        isLoading: marketLoading,
        isPartial: Boolean(overview?.partial),
        lastUpdatedAt: overview?.fetchedAt ?? null,
      }),
    [currentPrice, marketError, marketLoading, overview]
  );

  const handleAddEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setFormErrorField(null);

    const result = createDcaEntry({
      amountInvested,
      bitcoinPrice,
      date,
      note,
    });

    if (!result.success) {
      setFormError(result.error);
      setFormErrorField(result.field);
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
  const primaryResult = getPrimaryResultCopy(
    dcaView.summary.totalEntries,
    dcaView.summary.averageBuyPrice,
    currency
  );
  const performanceCopy = getPerformanceCopy(
    dcaView.summary.totalEntries,
    dcaView.summary.pnlAbsolute,
    dcaView.summary.pnlPercent,
    dcaView.summary.currentValue,
    currency
  );
  const hasEntries = entries.length > 0;

  return (
    <section className="tool-detail-page">
      <header className="section-hero">
        <p className="eyebrow">Tool</p>
        <h2>DCA-Rechner / Durchschnittskaufpreis</h2>
        <p className="subtitle">
          Erfasse deine Bitcoin-Kaeufe, behalte deinen Durchschnittspreis im Blick und
          vergleiche deinen Einstieg mit dem aktuellen Referenzpreis in {currency.toUpperCase()}.
        </p>
      </header>

      <div className="card tool-toolbar-card">
        <div className="tool-toolbar-copy">
          <p className="label">Marktdaten</p>
          <h3>Aktueller Referenzpreis</h3>
          <div className="mt-3 flex flex-col gap-3">
            <DataStateMeta lastUpdatedLabel="Zuletzt erfolgreich" state={marketState} />
            <DataState
              state={marketState}
              onRetry={() => void loadMarketOverview()}
              retryBusy={marketState.isLoading}
              messages={{
                loading: {
                  title: "Referenzpreis wird geladen",
                  description: "Der aktuelle BTC-Preis fuer den Rechner wird vorbereitet.",
                },
                empty: {
                  title: "Kein Referenzpreis verfuegbar",
                  description:
                    "Der Abruf war erfolgreich, liefert fuer die aktive Waehrung aber keinen verwendbaren Preis.",
                },
                error: {
                  title: "Referenzpreis ist gerade nicht verfuegbar",
                  description:
                    marketState.error ??
                    "Es konnte noch kein verlaesslicher Marktpreis fuer den Rechner geladen werden.",
                },
                partial: {
                  title: "Referenzpreis ist teilweise verfuegbar",
                  description:
                    "Der aktuelle Marktabruf ist unvollstaendig. Vorhandene Werte bleiben fuer den Rechner sichtbar.",
                },
                stale: {
                  title: "Letzter Referenzpreis bleibt sichtbar",
                  description:
                    "Die Aktualisierung ist fehlgeschlagen. Der angezeigte Preis kann inzwischen veraltet sein.",
                },
              }}
            >
              <p className="muted">{`Marktpreis: ${formatCurrency(currentPrice, currency)} / BTC`}</p>
            </DataState>
          </div>
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

      <article className="card dca-insight-card">
        <div>
          <p className="label">Einordnung</p>
          <h3>{primaryResult.title}</h3>
        </div>
        <p className="dca-insight-copy">{primaryResult.description}</p>
        <p className="dca-insight-copy">{performanceCopy}</p>
      </article>

      <div className="dca-summary-grid">
        <article className="card dca-summary-card">
          <p className="label">Bisher investiert</p>
          <h3>{formatCurrency(dcaView.summary.totalInvested, currency)}</h3>
          <p className="muted">Summe aller erfassten Kauefe in {currency.toUpperCase()}.</p>
        </article>
        <article className="card dca-summary-card">
          <p className="label">Erhaltenes BTC</p>
          <h3>{formatBtc(dcaView.summary.totalBitcoin)}</h3>
          <p className="muted">Berechnet aus Betrag und BTC-Preis jedes Kaufs.</p>
        </article>
        <article className="card dca-summary-card">
          <p className="label">Durchschnittlicher Kaufpreis</p>
          <h3>
            {dcaView.summary.averageBuyPrice === null
              ? FALLBACK_TEXT
              : `${formatCurrency(dcaView.summary.averageBuyPrice, currency)} / BTC`}
          </h3>
          <p className="muted">Dein rechnerischer Einstieg ueber alle Eintraege hinweg.</p>
        </article>
        <article className="card dca-summary-card">
          <p className="label">Aktueller Vergleichspreis</p>
          <h3>
            {dcaView.summary.currentPrice === null
              ? FALLBACK_TEXT
              : `${formatCurrency(dcaView.summary.currentPrice, currency)} / BTC`}
          </h3>
          <p className="muted">Der zuletzt geladene BTC-Referenzpreis fuer diese Waehrung.</p>
        </article>
        <article className="card dca-summary-card">
          <p className="label">Geschaetzter Wert heute</p>
          <h3>{formatCurrency(dcaView.summary.currentValue, currency)}</h3>
          <p className="muted">So viel waere dein Bestand beim aktuellen Referenzpreis wert.</p>
        </article>
        <article className="card dca-summary-card">
          <p className="label">Gewinn / Verlust</p>
          <h3 className={pnlValueClassName}>
            {formatCurrency(dcaView.summary.pnlAbsolute, currency)}
          </h3>
          <p className={pnlClassName}>{formatPercent(dcaView.summary.pnlPercent)}</p>
        </article>
      </div>

      <div className="tool-detail-layout dca-layout">
        <article ref={formCardRef} className="card dca-form-card">
          <p className="label">Neuer Kauf</p>
          <h3>Kauf eintragen</h3>
          <p className="muted dca-form-intro">
            Eintraege werden automatisch nur in diesem Browser gespeichert. USD und EUR
            bleiben bewusst getrennt, damit deine Reihen sauber vergleichbar bleiben.
          </p>

          <form className="dca-form" onSubmit={handleAddEntry}>
            <label className="input-group">
              <span>Kaufdatum</span>
              <input
                aria-invalid={formErrorField === "date"}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
              <small className="input-hint">Nutze das Datum, an dem der Kauf ausgefuehrt wurde.</small>
            </label>

            <label className="input-group">
              <span>Wie viel hast du investiert? ({currency.toUpperCase()})</span>
              <input
                aria-invalid={formErrorField === "amountInvested"}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amountInvested}
                onChange={(event) => setAmountInvested(event.target.value)}
                placeholder={currency === "usd" ? "250" : "200"}
              />
              <small className="input-hint">
                Gib den Gesamtbetrag des Kaufs ein. Komma und Punkt werden akzeptiert.
              </small>
            </label>

            <label className="input-group">
              <span>Welcher BTC-Preis galt beim Kauf? ({currency.toUpperCase()})</span>
              <input
                aria-invalid={formErrorField === "bitcoinPrice"}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={bitcoinPrice}
                onChange={(event) => setBitcoinPrice(event.target.value)}
                placeholder={currency === "usd" ? "50000" : "46000"}
              />
              <small className="input-hint">
                Das ist der Preis pro 1 BTC zum Kaufzeitpunkt, nicht dein investierter Gesamtbetrag.
              </small>
            </label>

            <label className="input-group">
              <span>Kurze Notiz (optional)</span>
              <input
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="z. B. Monatsrate Marz"
              />
              <small className="input-hint">
                Hilfreich fuer Erinnerungen wie Sparplan, Bonuskauf oder Dip.
              </small>
            </label>

            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}

            <div className="dca-form-actions">
              <button type="submit" className="refresh-btn">
                Kauf speichern
              </button>
              <p className="muted dca-persistence-note">
                Deine Liste bleibt auf diesem Geraet erhalten, bis du sie selbst loeschst.
              </p>
            </div>
          </form>
        </article>

        <article className="card dca-list-card">
          <div className="dca-list-header">
            <div>
              <p className="label">Kaufhistorie</p>
              <h3>
                {dcaView.summary.totalEntries} {dcaView.summary.totalEntries === 1 ? "Eintrag" : "Eintraege"}
              </h3>
              <p className="muted dca-history-copy">
                {hasEntries
                  ? `Du siehst hier deine lokal gespeicherte ${currency.toUpperCase()}-Reihe.`
                  : `Noch keine lokal gespeicherten Kauefe in ${currency.toUpperCase()}.`}
              </p>
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
                {currency.toUpperCase()}-Liste loeschen
              </button>
            </div>
          </div>

          {entries.length === 0 ? (
            <EmptyState
              className="dca-empty-state"
              title={`Deine ${currency.toUpperCase()}-Liste ist noch leer`}
              description={`Sobald du den ersten Kauf eintraegst, zeigt dir der Rechner deinen Durchschnittspreis, deinen BTC-Bestand und den heutigen Vergleichswert.`}
              action={
                <button
                  type="button"
                  className="refresh-btn"
                  onClick={() => formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  Ersten Kauf eintragen
                </button>
              }
            />
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
