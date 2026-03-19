import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppLocale } from "../i18n/config";
import { getDictionary } from "../i18n/dictionaries";
import { fetchJson } from "../lib/api";
import {
  normalizeDashboardWarningMessage,
  sanitizeDashboardErrorMessage,
} from "../lib/dashboard-state-copy";
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

const DASHBOARD_REFRESH_INTERVAL_MS = 60_000;
const NETWORK_BLOCK_POLL_INTERVAL_MS = 15_000;
const QUERY_RETRY_COUNT = 1;

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
  return fetchJson<MarketContextChartData>(
    `/api/market-context-chart?currency=${currency}`,
    locale
  );
}

function getSectionErrorMessage(fallback: string, error: unknown, locale: AppLocale) {
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
  const [refreshing, setRefreshing] = useState(false);

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

  const overviewQuery = useQuery({
    queryKey: ["dashboard", "overview", locale],
    queryFn: () => fetchOverview(locale),
    retry: QUERY_RETRY_COUNT,
  });
  const networkQuery = useQuery({
    queryKey: ["dashboard", "network", locale],
    queryFn: () => fetchNetwork(locale),
    retry: QUERY_RETRY_COUNT,
  });
  const sentimentQuery = useQuery({
    queryKey: ["dashboard", "sentiment", locale],
    queryFn: () => fetchSentiment(locale),
    retry: QUERY_RETRY_COUNT,
  });
  const chartQuery = useQuery({
    queryKey: ["dashboard", "chart", range, currency, locale],
    queryFn: () => fetchChart(range, currency, locale),
    retry: QUERY_RETRY_COUNT,
    placeholderData: (previousData) => previousData,
  });
  const performanceQuery = useQuery({
    queryKey: ["dashboard", "performance", currency, locale],
    queryFn: () => fetchPerformance(currency, locale),
    retry: QUERY_RETRY_COUNT,
    placeholderData: (previousData) => previousData,
  });
  const marketContextChartQuery = useQuery({
    queryKey: ["dashboard", "market-context-chart", currency, locale],
    queryFn: () => fetchMarketContextChart(currency, locale),
    retry: QUERY_RETRY_COUNT,
    placeholderData: (previousData) => previousData,
  });

  const overview = overviewQuery.data ?? null;
  const network = networkQuery.data ?? null;
  const sentiment = sentimentQuery.data ?? null;
  const chart = chartQuery.data ?? null;
  const performance = performanceQuery.data ?? null;
  const marketContextChart = marketContextChartQuery.data ?? null;
  const refetchOverview = overviewQuery.refetch;
  const refetchNetwork = networkQuery.refetch;
  const refetchSentiment = sentimentQuery.refetch;
  const refetchChart = chartQuery.refetch;
  const refetchPerformance = performanceQuery.refetch;
  const refetchMarketContextChart = marketContextChartQuery.refetch;

  const overviewError = useMemo(
    () =>
      overviewQuery.error
        ? getSectionErrorMessage(
            copy.stateCopy.fallbacks.overviewUnavailable,
            overviewQuery.error,
            locale
          )
        : "",
    [copy.stateCopy.fallbacks.overviewUnavailable, locale, overviewQuery.error]
  );
  const networkError = useMemo(
    () =>
      networkQuery.error
        ? getSectionErrorMessage(
            copy.stateCopy.fallbacks.networkUnavailable,
            networkQuery.error,
            locale
          )
        : "",
    [copy.stateCopy.fallbacks.networkUnavailable, locale, networkQuery.error]
  );
  const chartError = useMemo(
    () =>
      chartQuery.error
        ? getSectionErrorMessage(copy.stateCopy.fallbacks.chartUnavailable, chartQuery.error, locale)
        : "",
    [chartQuery.error, copy.stateCopy.fallbacks.chartUnavailable, locale]
  );
  const sentimentError = useMemo(
    () =>
      sentimentQuery.error
        ? getSectionErrorMessage(
            copy.stateCopy.fallbacks.sentimentUnavailable,
            sentimentQuery.error,
            locale
          )
        : "",
    [copy.stateCopy.fallbacks.sentimentUnavailable, locale, sentimentQuery.error]
  );
  const performanceError = useMemo(
    () =>
      performanceQuery.error
        ? getSectionErrorMessage(
            copy.stateCopy.fallbacks.performanceUnavailable,
            performanceQuery.error,
            locale
          )
        : "",
    [copy.stateCopy.fallbacks.performanceUnavailable, locale, performanceQuery.error]
  );
  const marketContextChartError = useMemo(
    () =>
      marketContextChartQuery.error
        ? getSectionErrorMessage(
            copy.stateCopy.fallbacks.chartUnavailable,
            marketContextChartQuery.error,
            locale
          )
        : "",
    [copy.stateCopy.fallbacks.chartUnavailable, locale, marketContextChartQuery.error]
  );

  const overviewLoading = overviewQuery.isPending;
  const networkLoading = networkQuery.isPending;
  const chartLoading = chartQuery.isPending;
  const sentimentLoading = sentimentQuery.isPending;
  const performanceLoading = performanceQuery.isPending;
  const marketContextChartLoading = marketContextChartQuery.isPending;

  const loadOverviewData = useCallback(async () => {
    const result = await refetchOverview();
    return result.data?.fetchedAt ?? null;
  }, [refetchOverview]);

  const loadNetworkData = useCallback(
    async (_options?: { silent?: boolean }) => {
      const result = await refetchNetwork();
      return result.data?.fetchedAt ?? null;
    },
    [refetchNetwork]
  );

  const loadSentimentData = useCallback(async () => {
    const result = await refetchSentiment();
    return result.data?.fetchedAt ?? null;
  }, [refetchSentiment]);

  const loadChartData = useCallback(
    async (_selectedRange: ChartRange, _selectedCurrency: Currency) => {
      const result = await refetchChart();
      return result.data?.fetchedAt ?? null;
    },
    [refetchChart]
  );

  const loadPerformanceData = useCallback(
    async (_selectedCurrency: Currency) => {
      const result = await refetchPerformance();
      return result.data?.fetchedAt ?? null;
    },
    [refetchPerformance]
  );

  const loadMarketContextChartData = useCallback(
    async (_selectedCurrency: Currency) => {
      const result = await refetchMarketContextChart();
      return result.data?.fetchedAt ?? null;
    },
    [refetchMarketContextChart]
  );

  const refreshAll = useCallback(
    async (_selectedRange: ChartRange, _selectedCurrency: Currency) => {
      setRefreshing(true);

      try {
        await Promise.all([
          refetchOverview(),
          refetchNetwork(),
          refetchChart(),
          refetchSentiment(),
          refetchPerformance(),
          refetchMarketContextChart(),
        ]);
      } finally {
        setRefreshing(false);
      }
    },
    [
      refetchChart,
      refetchMarketContextChart,
      refetchNetwork,
      refetchOverview,
      refetchPerformance,
      refetchSentiment,
    ]
  );

  useEffect(() => {
    if (!autoRefresh) return;

    const timerId = window.setInterval(() => {
      void refreshAll(range, currency);
    }, DASHBOARD_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, [autoRefresh, currency, range, refreshAll]);

  useEffect(() => {
    if (!autoRefresh) return;

    const timerId = window.setInterval(() => {
      void loadNetworkData({ silent: true });
    }, NETWORK_BLOCK_POLL_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, [autoRefresh, loadNetworkData]);

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
    [
      chart?.fetchedAt,
      marketContextChart?.fetchedAt,
      network?.fetchedAt,
      overview?.fetchedAt,
      performance?.fetchedAt,
      sentiment?.fetchedAt,
    ]
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
