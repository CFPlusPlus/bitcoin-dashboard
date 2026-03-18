"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/ui/Card";
import Button, { buttonVariants } from "../components/ui/Button";
import DataState from "../components/ui/data-state/DataState";
import DataStateMeta from "../components/ui/data-state/DataStateMeta";
import EmptyState from "../components/ui/data-state/EmptyState";
import { usePersistentState } from "../hooks/usePersistentState";
import { getLocalizedPathname } from "../i18n/config";
import { useI18n } from "../i18n/context";
import { formatMessage } from "../i18n/template";
import { cn } from "../lib/cn";
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
  currency: Currency,
  locale: "de" | "en",
  copy: ReturnType<typeof useI18n>["messages"]["dca"]
) {
  if (totalEntries === 0 || averageBuyPrice === null) {
    return {
      description: copy.primaryEmptyDescription,
      title: copy.primaryEmptyTitle,
    };
  }

  return {
    description: copy.primarySummaryDescription,
    title: formatMessage(copy.primarySummaryTitle, {
      value: formatCurrency(averageBuyPrice, currency, locale),
    }),
  };
}

function getPerformanceCopy(
  totalEntries: number,
  pnlAbsolute: number | null,
  pnlPercent: number | null,
  currentValue: number | null,
  currency: Currency,
  locale: "de" | "en",
  copy: ReturnType<typeof useI18n>["messages"]["dca"]
) {
  if (totalEntries === 0) {
    return copy.performanceEmpty;
  }

  if (currentValue === null || pnlAbsolute === null || pnlPercent === null) {
    return copy.performanceMissingPrice;
  }

  if (pnlAbsolute > 0) {
    return formatMessage(copy.performancePositive, {
      currentValue: formatCurrency(currentValue, currency, locale),
      deltaValue: formatCurrency(pnlAbsolute, currency, locale),
      deltaPercent: formatPercent(pnlPercent, locale),
    });
  }

  if (pnlAbsolute < 0) {
    return formatMessage(copy.performanceNegative, {
      currentValue: formatCurrency(currentValue, currency, locale),
      deltaValue: formatCurrency(Math.abs(pnlAbsolute), currency, locale),
      deltaPercent: formatPercent(Math.abs(pnlPercent) * -1, locale),
    });
  }

  return formatMessage(copy.performanceNeutral, {
    currentValue: formatCurrency(currentValue, currency, locale),
  });
}

export default function DcaCalculatorPage() {
  const { locale, messages } = useI18n();
  const copy = messages.dca;
  const unavailableText = messages.common.unavailable;
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
  const formCardRef = useRef<HTMLDivElement | null>(null);

  const loadMarketOverview = useCallback(async () => {
    setMarketLoading(true);
    setMarketError("");

    try {
      const overviewData = await fetchJson<Overview>("/api/overview", locale);
      setOverview(overviewData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.marketState.loadError;
      setMarketError(message);
    } finally {
      setMarketLoading(false);
    }
  }, [copy.marketState.loadError, locale]);

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
  const summaryToneClassName =
    summaryTone === "positive"
      ? "text-success"
      : summaryTone === "negative"
        ? "text-danger"
        : "text-fg-muted";
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
    }, locale);

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
  const primaryResult = getPrimaryResultCopy(
    dcaView.summary.totalEntries,
    dcaView.summary.averageBuyPrice,
    currency,
    locale,
    copy
  );
  const performanceCopy = getPerformanceCopy(
    dcaView.summary.totalEntries,
    dcaView.summary.pnlAbsolute,
    dcaView.summary.pnlPercent,
    dcaView.summary.currentValue,
    currency,
    locale,
    copy
  );
  const hasEntries = entries.length > 0;

  return (
    <section className="dca-page">
      <header className="dca-page__hero">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-accent">
          {copy.heroEyebrow}
        </p>
        <h2>{copy.heroTitle}</h2>
        <p className="dca-page__intro">
          {formatMessage(copy.heroDescription, { currency: currency.toUpperCase() })}
        </p>
      </header>

      <Card as="section" padding="lg" gap="md" className="dca-toolbar">
        <div className="dca-toolbar__copy">
          <p className="text-sm text-fg-secondary">{copy.marketDataEyebrow}</p>
          <h3>{copy.marketDataTitle}</h3>
          <div className="mt-3 flex flex-col gap-3">
            <DataStateMeta lastUpdatedLabel={messages.common.lastUpdated} state={marketState} />
            <DataState
              state={marketState}
              onRetry={() => void loadMarketOverview()}
              retryBusy={marketState.isLoading}
              messages={{
                loading: {
                  title: copy.marketState.loadingTitle,
                  description: copy.marketState.loadingDescription,
                },
                empty: {
                  title: copy.marketState.emptyTitle,
                  description: copy.marketState.emptyDescription,
                },
                error: {
                  title: copy.marketState.errorTitle,
                  description: marketState.error ?? copy.marketState.errorFallback,
                },
                partial: {
                  title: copy.marketState.partialTitle,
                  description: copy.marketState.partialDescription,
                },
                stale: {
                  title: copy.marketState.staleTitle,
                  description: copy.marketState.staleDescription,
                },
              }}
            >
              <p className="text-sm leading-6 text-fg-muted">
                {formatMessage(copy.marketPriceLine, {
                  value: formatCurrency(currentPrice, currency, locale),
                })}
              </p>
            </DataState>
          </div>
        </div>

        <div className="dca-toolbar__actions">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.currencyAriaLabel}>
            {(["usd", "eur"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                active={currency === value}
                intent="secondary"
                size="sm"
                className="min-w-[5rem]"
                onClick={() => setCurrency(value)}
              >
                {value.toUpperCase()}
              </Button>
            ))}
          </div>

          <Button type="button" intent="primary" size="sm" onClick={() => void loadMarketOverview()}>
            {copy.refreshPrice}
          </Button>
        </div>
      </Card>

      <Card as="article" padding="lg" gap="md" className="dca-insight-card">
        <div>
          <p className="text-sm text-fg-secondary">{copy.insightEyebrow}</p>
          <h3>{primaryResult.title}</h3>
        </div>
        <p className="dca-insight-copy">{primaryResult.description}</p>
        <p className="dca-insight-copy">{performanceCopy}</p>
      </Card>

      <div className="dca-summary-grid">
        <Card as="article" padding="md" gap="sm" className="dca-summary-card">
          <p className="text-sm text-fg-secondary">{copy.investedLabel}</p>
          <h3>{formatCurrency(dcaView.summary.totalInvested, currency, locale)}</h3>
          <p className="text-sm leading-6 text-fg-muted">
            {formatMessage(copy.investedDescription, { currency: currency.toUpperCase() })}
          </p>
        </Card>
        <Card as="article" padding="md" gap="sm" className="dca-summary-card">
          <p className="text-sm text-fg-secondary">{copy.bitcoinLabel}</p>
          <h3>{formatBtc(dcaView.summary.totalBitcoin, locale)}</h3>
          <p className="text-sm leading-6 text-fg-muted">
            {copy.bitcoinDescription}
          </p>
        </Card>
        <Card as="article" padding="md" gap="sm" className="dca-summary-card">
          <p className="text-sm text-fg-secondary">{copy.averageLabel}</p>
          <h3>
            {dcaView.summary.averageBuyPrice === null
              ? unavailableText
              : `${formatCurrency(dcaView.summary.averageBuyPrice, currency, locale)} / BTC`}
          </h3>
          <p className="text-sm leading-6 text-fg-muted">
            {copy.averageDescription}
          </p>
        </Card>
        <Card as="article" padding="md" gap="sm" className="dca-summary-card">
          <p className="text-sm text-fg-secondary">{copy.currentPriceLabel}</p>
          <h3>
            {dcaView.summary.currentPrice === null
              ? unavailableText
              : `${formatCurrency(dcaView.summary.currentPrice, currency, locale)} / BTC`}
          </h3>
          <p className="text-sm leading-6 text-fg-muted">
            {copy.currentPriceDescription}
          </p>
        </Card>
        <Card as="article" padding="md" gap="sm" className="dca-summary-card">
          <p className="text-sm text-fg-secondary">{copy.currentValueLabel}</p>
          <h3>{formatCurrency(dcaView.summary.currentValue, currency, locale)}</h3>
          <p className="text-sm leading-6 text-fg-muted">
            {copy.currentValueDescription}
          </p>
        </Card>
        <Card as="article" padding="md" gap="sm" className="dca-summary-card">
          <p className="text-sm text-fg-secondary">{copy.pnlLabel}</p>
          <h3 className={summaryTone === "default" ? undefined : summaryToneClassName}>
            {formatCurrency(dcaView.summary.pnlAbsolute, currency, locale)}
          </h3>
          <p className={cn("text-sm leading-6", summaryToneClassName)}>
            {formatPercent(dcaView.summary.pnlPercent, locale)}
          </p>
        </Card>
      </div>

      <div className="dca-layout">
        <div ref={formCardRef}>
          <Card as="article" padding="lg" gap="md" className="dca-form-card">
            <p className="text-sm text-fg-secondary">{copy.formEyebrow}</p>
            <h3>{copy.formTitle}</h3>
            <p className="text-sm leading-6 text-fg-muted">
              {copy.formDescription}
            </p>

            <form className="dca-form" onSubmit={handleAddEntry}>
              <label className="dca-input-group">
                <span>{copy.fields.date}</span>
                <input
                  aria-invalid={formErrorField === "date"}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
                <small className="dca-input-hint">
                  {copy.fields.dateHint}
                </small>
              </label>

              <label className="dca-input-group">
                <span>{formatMessage(copy.fields.amount, { currency: currency.toUpperCase() })}</span>
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
                <small className="dca-input-hint">
                  {copy.fields.amountHint}
                </small>
              </label>

              <label className="dca-input-group">
                <span>{formatMessage(copy.fields.bitcoinPrice, { currency: currency.toUpperCase() })}</span>
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
                <small className="dca-input-hint">
                  {copy.fields.bitcoinPriceHint}
                </small>
              </label>

              <label className="dca-input-group">
                <span>{copy.fields.note}</span>
                <input
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={copy.fields.notePlaceholder}
                />
                <small className="dca-input-hint">
                  {copy.fields.noteHint}
                </small>
              </label>

              {formError && (
                <p className="dca-form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="dca-form-actions">
                <Button type="submit" intent="primary" size="sm">
                  {copy.savePurchase}
                </Button>
                <p className="dca-persistence-note">
                  {copy.persistenceNote}
                </p>
              </div>
            </form>
          </Card>
        </div>

        <Card as="article" padding="lg" gap="md" className="dca-list-card">
          <div className="dca-list-header">
            <div>
              <p className="text-sm text-fg-secondary">{copy.historyEyebrow}</p>
              <h3>
                {formatMessage(
                  dcaView.summary.totalEntries === 1 ? copy.historySingular : copy.historyPlural,
                  { count: dcaView.summary.totalEntries }
                )}
              </h3>
              <p className="text-sm leading-6 text-fg-muted">
                {hasEntries
                  ? formatMessage(copy.historyFilled, { currency: currency.toUpperCase() })
                  : formatMessage(copy.historyEmpty, { currency: currency.toUpperCase() })}
              </p>
            </div>

            <div className="dca-list-actions">
              <Link
                className={cn(buttonVariants({ intent: "secondary", size: "sm" }), "min-w-[11rem] no-underline")}
                href={getLocalizedPathname(locale, "/tools")}
              >
                {copy.backToTools}
              </Link>
              <Button
                type="button"
                intent="secondary"
                size="sm"
                onClick={handleClearEntries}
                disabled={entries.length === 0}
              >
                {formatMessage(copy.clearSeries, { currency: currency.toUpperCase() })}
              </Button>
            </div>
          </div>

          {entries.length === 0 ? (
            <EmptyState
              className="dca-empty-state"
              title={formatMessage(copy.emptyStateTitle, { currency: currency.toUpperCase() })}
              description={copy.emptyStateDescription}
              action={
                <Button
                  type="button"
                  intent="primary"
                  size="sm"
                  onClick={() => formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  {copy.firstPurchase}
                </Button>
              }
            />
          ) : (
            <ul className="dca-entry-list">
              {dcaView.items.map((entry) => (
                <li key={entry.id} className="dca-entry-row">
                  <div className="dca-entry-main">
                    <div className="dca-entry-topline">
                      <strong>{formatDate(entry.date, locale)}</strong>
                      {entry.note ? <span className="dca-entry-note">{entry.note}</span> : null}
                    </div>
                    <div className="dca-entry-metrics">
                      <span>
                        {formatMessage(copy.rowInvested, {
                          value: formatCurrency(entry.amountInvested, currency, locale),
                        })}
                      </span>
                      <span>
                        {formatMessage(copy.rowBuyPrice, {
                          value: formatCurrency(entry.bitcoinPrice, currency, locale),
                        })}
                      </span>
                      <span>
                        {formatMessage(copy.rowBitcoinReceived, {
                          value: formatBtc(entry.bitcoinAmount, locale),
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    intent="secondary"
                    size="sm"
                    onClick={() => handleRemoveEntry(entry.id)}
                  >
                    {copy.rowRemove}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}
