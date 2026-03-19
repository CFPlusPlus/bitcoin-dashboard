import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppLocale } from "../i18n/config";
import { getDictionary } from "../i18n/dictionaries";
import { fetchJson } from "../lib/api";
import { normalizeDashboardWarningMessage, sanitizeDashboardErrorMessage } from "../lib/dashboard-state-copy";
import { getLatestSuccessfulUpdate, resolveAsyncDataState } from "../lib/data-state";
import type {
  ChartData,
  ChartRange,
  Currency,
  MarketContextChartData,
  Network,
  Overview,
  Performance,
  Sentiment,
} from "../types/dashboard";
import { usePersistentState } from "./usePersistentState";

const STORAGE_KEYS = {
  autoRefresh: "bitcoin-dashboard:auto-refresh",
  currency: "bitcoin-dashboard:currency",
  range: "bitcoin-dashboard:range",
} as const;

function isCurrency(value: unknown): value is Currency {
  return value === "usd" || value === "eur";
}

function isChartRange(value: unknown): value is ChartRange {
  return value === 1 || value === 7 || value === 30;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

async function fetchOverview(locale: AppLocale) {
  return fetchJson<Overview>("/api/overview", locale);
}

async function fetchNetwork(locale: AppLocale) {
  return fetchJson<Network>("/api/network", locale);
}

async function fetchSentiment(locale: AppLocale) {
  return fetchJson<Sentiment>("/api/sentiment", locale);
}

async function fetchChart(range: ChartRange, currency: Currency, locale: AppLocale) {
  return fetchJson<ChartData>(`/api/chart?days=${range}&currency=${currency}`, locale);
}

async function fetchPerformance(currency: Currency, locale: AppLocale) {
  return fetchJson<Performance>(`/api/performance?currency=${currency}`, locale);
}

async function fetchMarketContextChart(currency: Currency, locale: AppLocale) {
  return fetchJson<MarketContextChartData>(`/api/market-context-chart?currency=${currency}`, locale);
}

function getSectionErrorMessage(
  fallback: string,
  error: unknown,
  locale: AppLocale
) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  return sanitizeDashboardErrorMessage(error.message, fallback, locale);
}

export function useDashboardData(locale: AppLocale) {
  const copy = getDictionary(locale).dashboard;
  const chartRangeStateOptions = useMemo(() => ({ validator: isChartRange }), []);
  const currencyStateOptions = useMemo(() => ({ validator: isCurrency }), []);
  const autoRefreshStateOptions = useMemo(() => ({ validator: isBoolean }), []);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [marketContextChart, setMarketContextChart] = useState<MarketContextChartData | null>(null);

  const [range, setRange] = usePersistentState<ChartRange>(
    STORAGE_KEYS.range,
    1,
    chartRangeStateOptions
  );
  const [currency, setCurrency] = usePersistentState<Currency>(
    STORAGE_KEYS.currency,
    "usd",
    currencyStateOptions
  );
  const [autoRefresh, setAutoRefresh] = usePersistentState<boolean>(
    STORAGE_KEYS.autoRefresh,
    true,
    autoRefreshStateOptions
  );

  const [overviewError, setOverviewError] = useState("");
  const [networkError, setNetworkError] = useState("");
  const [chartError, setChartError] = useState("");
  const [sentimentError, setSentimentError] = useState("");
  const [performanceError, setPerformanceError] = useState("");
  const [marketContextChartError, setMarketContextChartError] = useState("");

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [sentimentLoading, setSentimentLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [marketContextChartLoading, setMarketContextChartLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const initialChartHandledRef = useRef(false);
  const initialPerformanceHandledRef = useRef(false);
  const initialMarketContextChartHandledRef = useRef(false);
  const initialRefreshHandledRef = useRef(false);

  const loadOverviewData = useCallback(async () => {
    setOverviewError("");
    setOverviewLoading(true);

    try {
      const overviewData = await fetchOverview(locale);
      setOverview(overviewData);
      return overviewData.fetchedAt;
    } catch (error) {
      setOverviewError(
        getSectionErrorMessage(
          copy.stateCopy.fallbacks.overviewUnavailable,
          error,
          locale
        )
      );
      return null;
    } finally {
      setOverviewLoading(false);
    }
  }, [copy.stateCopy.fallbacks.overviewUnavailable, locale]);

  const loadNetworkData = useCallback(async () => {
    setNetworkError("");
    setNetworkLoading(true);

    try {
      const networkData = await fetchNetwork(locale);
      setNetwork(networkData);
      return networkData.fetchedAt;
    } catch (error) {
      setNetworkError(
        getSectionErrorMessage(
          copy.stateCopy.fallbacks.networkUnavailable,
          error,
          locale
        )
      );
      return null;
    } finally {
      setNetworkLoading(false);
    }
  }, [copy.stateCopy.fallbacks.networkUnavailable, locale]);

  const loadSentimentData = useCallback(async () => {
    setSentimentError("");
    setSentimentLoading(true);

    try {
      const sentimentData = await fetchSentiment(locale);
      setSentiment(sentimentData);
      return sentimentData.fetchedAt;
    } catch (error) {
      setSentimentError(
        getSectionErrorMessage(
          copy.stateCopy.fallbacks.sentimentUnavailable,
          error,
          locale
        )
      );
      return null;
    } finally {
      setSentimentLoading(false);
    }
  }, [copy.stateCopy.fallbacks.sentimentUnavailable, locale]);

  const loadChartData = useCallback(async (selectedRange: ChartRange, selectedCurrency: Currency) => {
    setChartError("");
    setChartLoading(true);

    try {
      const chartData = await fetchChart(selectedRange, selectedCurrency, locale);
      setChart(chartData);
      return chartData.fetchedAt;
    } catch (error) {
      setChartError(
        getSectionErrorMessage(
          copy.stateCopy.fallbacks.chartUnavailable,
          error,
          locale
        )
      );
      return null;
    } finally {
      setChartLoading(false);
    }
  }, [copy.stateCopy.fallbacks.chartUnavailable, locale]);

  const loadPerformanceData = useCallback(async (selectedCurrency: Currency) => {
    setPerformanceError("");
    setPerformanceLoading(true);

    try {
      const performanceData = await fetchPerformance(selectedCurrency, locale);
      setPerformance(performanceData);
      return performanceData.fetchedAt;
    } catch (error) {
      setPerformanceError(
        getSectionErrorMessage(
          copy.stateCopy.fallbacks.performanceUnavailable,
          error,
          locale
        )
      );
      return null;
    } finally {
      setPerformanceLoading(false);
    }
  }, [copy.stateCopy.fallbacks.performanceUnavailable, locale]);

  const loadMarketContextChartData = useCallback(async (selectedCurrency: Currency) => {
    setMarketContextChartError("");
    setMarketContextChartLoading(true);

    try {
      const marketContextChartData = await fetchMarketContextChart(selectedCurrency, locale);
      setMarketContextChart(marketContextChartData);
      return marketContextChartData.fetchedAt;
    } catch (error) {
      setMarketContextChartError(
        getSectionErrorMessage(
          copy.stateCopy.fallbacks.chartUnavailable,
          error,
          locale
        )
      );
      return null;
    } finally {
      setMarketContextChartLoading(false);
    }
  }, [copy.stateCopy.fallbacks.chartUnavailable, locale]);

  const refreshAll = useCallback(
    async (selectedRange: ChartRange, selectedCurrency: Currency) => {
      setRefreshing(true);

      await Promise.all([
        loadOverviewData(),
        loadNetworkData(),
        loadChartData(selectedRange, selectedCurrency),
        loadSentimentData(),
        loadPerformanceData(selectedCurrency),
        loadMarketContextChartData(selectedCurrency),
      ]);

      setRefreshing(false);
    },
    [loadChartData, loadMarketContextChartData, loadNetworkData, loadOverviewData, loadPerformanceData, loadSentimentData]
  );

  useEffect(() => {
    if (initialRefreshHandledRef.current) return;
    initialRefreshHandledRef.current = true;
    void refreshAll(range, currency);
  }, [currency, range, refreshAll]);

  useEffect(() => {
    if (!initialChartHandledRef.current) {
      initialChartHandledRef.current = true;
      return;
    }

    void loadChartData(range, currency);
  }, [currency, range, loadChartData]);

  useEffect(() => {
    if (!initialPerformanceHandledRef.current) {
      initialPerformanceHandledRef.current = true;
      return;
    }

    void loadPerformanceData(currency);
  }, [currency, loadPerformanceData]);

  useEffect(() => {
    if (!initialMarketContextChartHandledRef.current) {
      initialMarketContextChartHandledRef.current = true;
      return;
    }

    void loadMarketContextChartData(currency);
  }, [currency, loadMarketContextChartData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const timerId = window.setInterval(() => {
      void refreshAll(range, currency);
    }, 60_000);

    return () => window.clearInterval(timerId);
  }, [autoRefresh, currency, range, refreshAll]);

  const warnings = useMemo(() => {
    const items = [
      ...(overview?.warnings ?? []),
      ...(network?.warnings ?? []),
      ...(sentiment?.warnings ?? []),
      ...(chart?.warnings ?? []),
      ...(performance?.warnings ?? []),
      ...(marketContextChart?.warnings ?? []),
    ]
      .map((warning) => normalizeDashboardWarningMessage(warning, locale))
      .filter(Boolean);

    return [...new Set(items)];
  }, [chart, locale, marketContextChart, network, overview, performance, sentiment]);

  const overviewMetrics = useMemo(
    () =>
      overview
        ? [
            overview.priceUsd,
            overview.priceEur,
            overview.change24hUsd,
            overview.change24hEur,
            overview.volume24hUsd,
            overview.volume24hEur,
            overview.marketCapUsd,
            overview.marketCapEur,
            overview.high24hUsd,
            overview.high24hEur,
            overview.low24hUsd,
            overview.low24hEur,
          ]
        : [],
    [overview]
  );

  const networkMetrics = useMemo(
    () =>
      network
        ? [
            network.latestBlockHeight,
            network.fees.fastestFee,
            network.fees.halfHourFee,
            network.fees.hourFee,
            network.fees.economyFee,
            network.fees.minimumFee,
            network.hashrate.currentEhPerSecond,
            network.hashrate.changePercent30d,
            network.difficulty.current,
            network.difficulty.adjustmentPercent,
            network.difficulty.progressPercent,
            network.difficulty.remainingBlocks,
            network.mempool.pendingTransactions,
            network.mempool.pendingVirtualSizeMb,
          ]
        : [],
    [network]
  );

  const sentimentMetrics = useMemo(
    () =>
      sentiment
        ? [
            sentiment.value,
            sentiment.classification,
            sentiment.timeUntilUpdateSeconds,
            sentiment.nextUpdateAt,
          ]
        : [],
    [sentiment]
  );

  const hasOverviewData = overviewMetrics.some((value) => value !== null);
  const hasNetworkData = networkMetrics.some((value) => value !== null);
  const hasSentimentData = sentimentMetrics.some((value) => value !== null);
  const hasChartData = chart !== null && chart.points.length > 0;
  const hasPerformanceData = Boolean(
    performance?.periods.some((period) => period.changePercent !== null)
  );
  const hasMarketContextChartData = Boolean(
    marketContextChart?.series.some((series) => series.points.length > 0)
  );

  const overviewState = useMemo(
    () =>
      resolveAsyncDataState({
        data: overview,
        error: overviewError,
        hasUsableData: hasOverviewData,
        isEmpty: overview !== null && !hasOverviewData,
        isLoading: overviewLoading,
        isPartial:
          Boolean(overview?.partial) ||
          (hasOverviewData && overviewMetrics.some((value) => value === null)),
        lastUpdatedAt: overview?.fetchedAt ?? null,
      }),
    [hasOverviewData, overview, overviewError, overviewLoading, overviewMetrics]
  );

  const networkState = useMemo(
    () =>
      resolveAsyncDataState({
        data: network,
        error: networkError,
        hasUsableData: hasNetworkData,
        isEmpty: network !== null && !hasNetworkData,
        isLoading: networkLoading,
        isPartial:
          Boolean(network?.partial) ||
          (hasNetworkData && networkMetrics.some((value) => value === null)),
        lastUpdatedAt: network?.fetchedAt ?? null,
      }),
    [hasNetworkData, network, networkError, networkLoading, networkMetrics]
  );

  const sentimentState = useMemo(
    () =>
      resolveAsyncDataState({
        data: sentiment,
        error: sentimentError,
        hasUsableData: hasSentimentData,
        isEmpty: sentiment !== null && !hasSentimentData,
        isLoading: sentimentLoading,
        isPartial:
          Boolean(sentiment?.partial) ||
          (hasSentimentData && sentimentMetrics.some((value) => value === null)),
        lastUpdatedAt: sentiment?.fetchedAt ?? null,
      }),
    [hasSentimentData, sentiment, sentimentError, sentimentLoading, sentimentMetrics]
  );

  const chartState = useMemo(
    () =>
      resolveAsyncDataState({
        data: chart,
        error: chartError,
        hasUsableData: hasChartData,
        isEmpty: chart !== null && chart.points.length === 0,
        isLoading: chartLoading,
        isPartial: Boolean(chart?.partial),
        lastUpdatedAt: chart?.fetchedAt ?? null,
      }),
    [chart, chartError, chartLoading, hasChartData]
  );

  const performanceState = useMemo(
    () =>
      resolveAsyncDataState({
        data: performance,
        error: performanceError,
        hasUsableData: hasPerformanceData,
        isEmpty: performance !== null && performance.periods.length === 0,
        isLoading: performanceLoading,
        isPartial:
          Boolean(performance?.partial) ||
          Boolean(
            performance &&
              performance.periods.length > 0 &&
              performance.periods.some((period) => period.changePercent === null)
          ),
        lastUpdatedAt: performance?.fetchedAt ?? null,
      }),
    [hasPerformanceData, performance, performanceError, performanceLoading]
  );

  const marketContextChartState = useMemo(
    () =>
      resolveAsyncDataState({
        data: marketContextChart,
        error: marketContextChartError,
        hasUsableData: hasMarketContextChartData,
        isEmpty:
          marketContextChart !== null &&
          marketContextChart.series.every((series) => series.points.length === 0),
        isLoading: marketContextChartLoading,
        isPartial: Boolean(marketContextChart?.partial),
        lastUpdatedAt: marketContextChart?.fetchedAt ?? null,
      }),
    [
      hasMarketContextChartData,
      marketContextChart,
      marketContextChartError,
      marketContextChartLoading,
    ]
  );

  const lastRefreshAt = useMemo(
    () =>
      getLatestSuccessfulUpdate([
        overview?.fetchedAt,
        network?.fetchedAt,
        sentiment?.fetchedAt,
        chart?.fetchedAt,
        performance?.fetchedAt,
        marketContextChart?.fetchedAt,
      ]),
    [chart?.fetchedAt, marketContextChart?.fetchedAt, network?.fetchedAt, overview?.fetchedAt, performance?.fetchedAt, sentiment?.fetchedAt]
  );

  const dashboardState = useMemo(
    () =>
      resolveAsyncDataState({
        data: lastRefreshAt ? { lastRefreshAt } : null,
        error: [
          overviewError,
          networkError,
          sentimentError,
          chartError,
          performanceError,
          marketContextChartError,
        ].find(Boolean),
        hasUsableData:
          overviewState.hasUsableData ||
          networkState.hasUsableData ||
          sentimentState.hasUsableData ||
          chartState.hasUsableData ||
          performanceState.hasUsableData ||
          marketContextChartState.hasUsableData,
        isLoading: refreshing && !lastRefreshAt,
        isPartial:
          overviewState.status === "partial" ||
          networkState.status === "partial" ||
          sentimentState.status === "partial" ||
          chartState.status === "partial" ||
          performanceState.status === "partial" ||
          marketContextChartState.status === "partial",
        isRefreshing: refreshing && Boolean(lastRefreshAt),
        lastUpdatedAt: lastRefreshAt,
      }),
    [
      chartError,
      chartState.hasUsableData,
      chartState.status,
      lastRefreshAt,
      marketContextChartError,
      marketContextChartState.hasUsableData,
      marketContextChartState.status,
      networkError,
      networkState.hasUsableData,
      networkState.status,
      overviewError,
      overviewState.hasUsableData,
      overviewState.status,
      performanceError,
      performanceState.hasUsableData,
      performanceState.status,
      refreshing,
      sentimentError,
      sentimentState.hasUsableData,
      sentimentState.status,
    ]
  );

  return {
    autoRefresh,
    chart,
    chartError,
    chartLoading,
    chartState,
    currency,
    dashboardState,
    lastRefreshAt,
    marketContextChart,
    marketContextChartState,
    network,
    networkError,
    networkLoading,
    networkState,
    overview,
    overviewError,
    overviewLoading,
    overviewState,
    performance,
    performanceError,
    performanceLoading,
    performanceState,
    range,
    refreshing,
    sentiment,
    sentimentError,
    sentimentLoading,
    sentimentState,
    warnings,
    setAutoRefresh,
    setCurrency,
    setRange,
    loadNetworkData,
    loadOverviewData,
    loadPerformanceData,
    loadSentimentData,
    loadChartData,
    loadMarketContextChartData,
    refreshAll,
  };
}
