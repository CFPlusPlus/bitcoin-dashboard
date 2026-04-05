"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LivePriceSparkline, { type LivePricePoint } from "../../components/LivePriceSparkline";
import type { AsyncDataState } from "../../lib/data-state";
import type { Currency, Overview } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import {
  formatCompactCurrencyValue,
  formatCurrency,
  formatCurrencyValue,
  formatDateTime,
  formatNumber,
  formatPercent,
} from "../../lib/format";
import { formatMessage } from "../../i18n/template";
import { useI18n } from "../../i18n/context";
import MetricCard from "../../components/MetricCard";
import Card from "../../components/ui/Card";
import MetaText from "../../components/ui/content/MetaText";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import { getOverviewValues } from "./overview-values";

type OverviewSectionProps = {
  currency: Currency;
  onRetry: () => void;
  overview: Overview | null;
  overviewState: AsyncDataState<Overview>;
};

type LivePriceSeries = {
  currency: Currency;
  points: LivePricePoint[];
};

type LiveSnapshot = {
  currency: Currency;
  price: number | null;
  updatedAt: string | null;
};

const LIVE_WINDOW_MS = 30_000;
const COINBASE_WS_URL = "wss://advanced-trade-ws.coinbase.com";
const RECONNECT_DELAY_MS = 1_500;

type LiveConnectionState = "connecting" | "live" | "reconnecting" | "fallback";

type CoinbaseTickerMessage = {
  channel?: string;
  events?: Array<{
    tickers?: Array<{
      price?: string;
      product_id?: string;
    }>;
    type?: string;
  }>;
  timestamp?: string;
  type?: string;
};

function getSeedTimestamp(value: string | null) {
  if (!value) return 0;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function pruneLivePoints(points: LivePricePoint[], now = Date.now()) {
  return points.filter((point) => now - point.timestamp <= LIVE_WINDOW_MS);
}

function getDirectLiveProductId(currency: Currency) {
  if (currency === "eur") {
    return "BTC-EUR";
  }

  if (currency === "usd") {
    return "BTC-USD";
  }

  return null;
}

function parseCoinbaseTickerMessage(raw: string, productId: string) {
  let payload: CoinbaseTickerMessage;

  try {
    payload = JSON.parse(raw) as CoinbaseTickerMessage;
  } catch {
    return null;
  }

  if (payload.channel !== "ticker" || !payload.events?.length) {
    return null;
  }

  for (const event of payload.events) {
    for (const ticker of event.tickers ?? []) {
      if (ticker.product_id !== productId || typeof ticker.price !== "string") {
        continue;
      }

      const price = Number(ticker.price);
      const timestamp = payload.timestamp ?? null;

      if (!Number.isFinite(price)) {
        continue;
      }

      return {
        price,
        timestamp,
      };
    }
  }

  return null;
}

export default function OverviewSection({
  currency,
  onRetry,
  overview,
  overviewState,
}: OverviewSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.overview;
  const marketContextCopy = messages.dashboard.marketContext;
  const currencyLabel = currency.toUpperCase();
  const { change24h, high24h, low24h, marketCapRank, price, volume24h } = getOverviewValues(
    overview,
    currency
  );
  const stateMessages = getDashboardSectionStateMessages("overview", overviewState.error, locale);
  const [liveSeries, setLiveSeries] = useState<LivePriceSeries | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot | null>(null);
  const [liveConnection, setLiveConnection] = useState<{
    currency: Currency;
    state: LiveConnectionState;
  } | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const activeLiveSnapshot = liveSnapshot?.currency === currency ? liveSnapshot : null;
  const livePoints =
    liveSeries?.currency === currency
      ? liveSeries.points
      : typeof price === "number"
        ? [
            {
              price,
              timestamp: getSeedTimestamp(overview?.fetchedAt ?? null),
            },
          ]
        : [];
  const displayedPrice = activeLiveSnapshot?.price ?? price;
  const displayedChange24h = change24h;
  const displayedFetchedAt = activeLiveSnapshot?.updatedAt ?? overview?.fetchedAt ?? null;
  const directLiveProductId = getDirectLiveProductId(currency);
  const conversionRate = (() => {
    if (directLiveProductId) {
      return 1;
    }

    const selectedPrice = typeof price === "number" ? price : null;
    const referenceUsdPrice =
      typeof overview?.referenceUsdPrice === "number" ? overview.referenceUsdPrice : null;

    if (
      selectedPrice === null ||
      selectedPrice <= 0 ||
      referenceUsdPrice === null ||
      referenceUsdPrice <= 0
    ) {
      return null;
    }

    return selectedPrice / referenceUsdPrice;
  })();
  const liveProductId = directLiveProductId ?? (conversionRate ? "BTC-USD" : null);
  const isConvertedLive = !directLiveProductId && liveProductId === "BTC-USD";
  const isLiveSparklineSupported = liveProductId !== null;
  const liveConnectionState =
    liveConnection?.currency === currency ? liveConnection.state : "connecting";
  const liveStatusText = useMemo(() => {
    if (!isLiveSparklineSupported) {
      return formatMessage(copy.liveStatusUnsupported, { currency: currencyLabel });
    }

    if (liveConnectionState === "live") {
      if (isConvertedLive) {
        return formatMessage(copy.liveStatusConverted, { currency: currencyLabel });
      }

      return copy.liveStatusActive;
    }

    if (liveConnectionState === "reconnecting") {
      return copy.liveStatusReconnecting;
    }

    if (liveConnectionState === "fallback") {
      return copy.liveStatusFallback;
    }

    return copy.liveStatusConnecting;
  }, [
    copy.liveStatusActive,
    copy.liveStatusConnecting,
    copy.liveStatusConverted,
    copy.liveStatusFallback,
    copy.liveStatusReconnecting,
    copy.liveStatusUnsupported,
    currencyLabel,
    isConvertedLive,
    isLiveSparklineSupported,
    liveConnectionState,
  ]);
  const liveUpdatedText =
    isLiveSparklineSupported && displayedFetchedAt
      ? formatMessage(copy.liveUpdated, { value: formatDateTime(displayedFetchedAt, locale) })
      : null;

  useEffect(() => {
    if (!liveProductId) {
      return;
    }

    let socket: WebSocket | null = null;
    let cancelled = false;

    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const connect = () => {
      if (cancelled) return;

      socket = new WebSocket(COINBASE_WS_URL);

      socket.addEventListener("open", () => {
        if (cancelled || !socket) return;

        setLiveConnection({ currency, state: "connecting" });
        socket.send(
          JSON.stringify({
            type: "subscribe",
            channel: "heartbeats",
            product_ids: [liveProductId],
          })
        );
        socket.send(
          JSON.stringify({
            type: "subscribe",
            channel: "ticker",
            product_ids: [liveProductId],
          })
        );
      });

      socket.addEventListener("message", (event) => {
        if (cancelled) return;

        const tick = parseCoinbaseTickerMessage(String(event.data), liveProductId);

        if (!tick) {
          return;
        }

        const pointTimestamp = getSeedTimestamp(tick.timestamp) || Date.now();
        const livePrice =
          isConvertedLive && conversionRate ? tick.price * conversionRate : tick.price;

        if (!Number.isFinite(livePrice)) {
          return;
        }

        setLiveSnapshot({
          currency,
          price: livePrice,
          updatedAt: tick.timestamp,
        });
        setLiveConnection({ currency, state: "live" });
        setLiveSeries((currentSeries) => ({
          currency,
          points: pruneLivePoints(
            [
              ...(currentSeries?.currency === currency ? currentSeries.points : []),
              {
                price: livePrice,
                timestamp: pointTimestamp,
              },
            ],
            pointTimestamp
          ),
        }));
      });

      socket.addEventListener("error", () => {
        if (cancelled) return;
        setLiveConnection({ currency, state: "fallback" });
      });

      socket.addEventListener("close", () => {
        if (cancelled) return;

        setLiveConnection((currentConnection) => ({
          currency,
          state:
            currentConnection?.currency === currency &&
            (currentConnection.state === "live" || currentConnection.state === "connecting")
              ? "reconnecting"
              : "fallback",
        }));

        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, RECONNECT_DELAY_MS);
      });
    };

    connect();

    return () => {
      cancelled = true;

      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      socket?.close();
    };
  }, [conversionRate, currency, isConvertedLive, liveProductId]);

  return (
    <Card as="section" tone="elevated" padding="md" gap="md" className="overflow-hidden">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        meta={<DataStateMeta state={overviewState} />}
      />

      <DataState
        state={overviewState}
        onRetry={onRetry}
        retryBusy={overviewState.isLoading}
        messages={stateMessages}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.56fr)_minmax(20rem,0.94fr)]">
          <div
            className="flex h-full flex-col justify-between gap-6 overflow-hidden rounded-md border border-accent px-5 py-5 sm:px-7 sm:py-6"
            style={{ background: "var(--token-color-bg-elevated)" }}
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 border-b border-border-default pb-5">
                <MetaText className="uppercase tracking-[0.18em]" size="xs">
                  {formatMessage(copy.spotLabel, { currency: currencyLabel })}
                </MetaText>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-col gap-3">
                    <p className="font-numeric tabular-nums text-[2.6rem] font-medium leading-none tracking-[-0.06em] text-fg sm:text-[4.15rem] xl:text-[5.2rem]">
                      {formatCurrency(displayedPrice, currency, locale)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <MetaText>
                        {formatMessage(copy.spotMeta, { currency: currencyLabel })}
                      </MetaText>
                      <MetaText
                        className={
                          typeof displayedChange24h === "number" && displayedChange24h > 0
                            ? "text-success"
                            : typeof displayedChange24h === "number" && displayedChange24h < 0
                              ? "text-danger"
                              : undefined
                        }
                      >
                        {formatPercent(displayedChange24h, locale)} {copy.liveDeltaLabel}
                      </MetaText>
                    </div>
                  </div>
                </div>
              </div>

              {isLiveSparklineSupported ? (
                <LivePriceSparkline
                  key={currency}
                  currency={currency}
                  performancePercent={displayedChange24h}
                  points={livePoints}
                />
              ) : (
                <div className="flex min-h-[9.5rem] items-center justify-center rounded-md border border-border-subtle bg-muted-surface px-4 py-5">
                  <p className="max-w-xl text-center text-sm leading-6 text-fg-secondary">
                    {liveStatusText}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <MetaText className="text-fg-secondary">{liveStatusText}</MetaText>
                {liveUpdatedText ? <MetaText>{liveUpdatedText}</MetaText> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: formatMessage(copy.highLabel, { currency: currencyLabel }),
                text: formatCurrencyValue(high24h, currency, locale),
                meta: copy.highMeta,
                footnote: copy.highFootnote,
                tone: "default" as const,
              },
              {
                label: formatMessage(copy.lowLabel, { currency: currencyLabel }),
                text: formatCurrencyValue(low24h, currency, locale),
                meta: copy.lowMeta,
                footnote: copy.lowFootnote,
                tone: "muted" as const,
              },
              {
                label: formatMessage(marketContextCopy.volumeLabel, { currency: currencyLabel }),
                text: formatCompactCurrencyValue(volume24h, currency, locale),
                meta: marketContextCopy.volumeMeta,
                footnote: marketContextCopy.volumeFootnote,
                tone: "default" as const,
              },
              {
                label: copy.rankLabel,
                text:
                  marketCapRank === null || marketCapRank === undefined
                    ? messages.common.unavailable
                    : `#${formatNumber(marketCapRank, locale)}`,
                meta: copy.rankMeta,
                footnote: copy.rankFootnote,
                tone: "muted" as const,
              },
            ].map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.text}
                meta={item.meta}
                valueFootnote={item.footnote}
                tone={item.tone}
              />
            ))}
          </div>
        </div>
      </DataState>
    </Card>
  );
}
