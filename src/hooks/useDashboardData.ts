import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppLocale } from "../i18n/config";
import { getDictionary } from "../i18n/dictionaries";
import { getDashboardNoticeCandidates, PERSISTENT_NOTICE_DELAY_MS } from "../lib/dashboard-notices";
import { fetchJson } from "../lib/api";
import { CURRENCY_STORAGE_KEY, DEFAULT_CURRENCY, isCurrency } from "../lib/currency";
import { sanitizeDashboardErrorMessage } from "../lib/dashboard-state-copy";
import { getLatestSuccessfulUpdate, resolveAsyncDataState } from "../lib/data-state";
import type {
  ChartData,
  ChartRange,
  Currency,
  DashboardBundleSectionError,
  DashboardCoreBundle,
  DashboardSlowBundle,
  MarketContextChartData,
  Network,
  OnChainActivity,
  Overview,
  Performance,
  Sentiment,
} from "../types/dashboard";
import { useDashboardPollingLeader } from "./useDashboardPollingLeader";
import { usePersistentNoticeMessages } from "./usePersistentNoticeMessages";
import { usePersistentState } from "./usePersistentState";

const STORAGE_KEYS = {
  autoRefresh: "bitcoin-dashboard:auto-refresh",
  currency: CURRENCY_STORAGE_KEY,
  range: "bitcoin-dashboard:range",
} as const;

const DASHBOARD_CORE_REFRESH_INTERVAL_MS = 2 * 60_000;
const DASHBOARD_SLOW_REFRESH_INTERVAL_MS = 30 * 60_000;
const QUERY_RETRY_COUNT = 1;

function isChartRange(value: unknown): value is ChartRange {
  return value === 1 || value === 7 || value === 30;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

async function fetchDashboardCore(range: ChartRange, currency: Currency, locale: AppLocale) {
  return fetchJson<DashboardCoreBundle>(
    `/api/dashboard-core?days=${range}&currency=${currency}`,
    locale
  );
}

async function fetchDashboardSlow(currency: Currency, locale: AppLocale) {
  return fetchJson<DashboardSlowBundle>(`/api/dashboard-slow?currency=${currency}`, locale);
}

function getSectionErrorMessage(fallback: string, error: unknown, locale: AppLocale) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  return sanitizeDashboardErrorMessage(error.message, fallback, locale);
}

function getBundledSectionErrorMessage(
  fallback: string,
  sectionError: DashboardBundleSectionError | null | undefined,
  queryError: unknown,
  locale: AppLocale
) {
  if (sectionError?.message) {
    return sanitizeDashboardErrorMessage(sectionError.message, fallback, locale);
  }

  if (queryError) {
    return getSectionErrorMessage(fallback, queryError, locale);
  }

  return "";
}

function getDocumentVisibility() {
  if (typeof document === "undefined") {
    return true;
  }

  return !document.hidden;
}

export function useDashboardData(locale: AppLocale) {
  const copy = getDictionary(locale).dashboard;
  const chartRangeStateOptions = useMemo(() => ({ validator: isChartRange }), []);
  const currencyStateOptions = useMemo(() => ({ validator: isCurrency }), []);
  const autoRefreshStateOptions = useMemo(() => ({ validator: isBoolean }), []);
  const [refreshing, setRefreshing] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(getDocumentVisibility);

  const [range, setRange] = usePersistentState<ChartRange>(
    STORAGE_KEYS.range,
    1,
    chartRangeStateOptions
  );
  const [currency, setCurrency] = usePersistentState<Currency>(
    STORAGE_KEYS.currency,
    DEFAULT_CURRENCY,
    currencyStateOptions
  );
  const [autoRefresh, setAutoRefresh] = usePersistentState<boolean>(
    STORAGE_KEYS.autoRefresh,
    true,
    autoRefreshStateOptions
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return () => undefined;
    }

    const handleVisibilityChange = () => {
      setIsDocumentVisible(getDocumentVisibility());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const isActivePollingTab = useDashboardPollingLeader(autoRefresh && isDocumentVisible);

  const coreQuery = useQuery({
    queryKey: ["dashboard", "core", range, currency, locale],
    queryFn: () => fetchDashboardCore(range, currency, locale),
    retry: QUERY_RETRY_COUNT,
    placeholderData: (previousData) => previousData,
  });
  const slowQuery = useQuery({
    queryKey: ["dashboard", "slow", currency, locale],
    queryFn: () => fetchDashboardSlow(currency, locale),
    retry: QUERY_RETRY_COUNT,
    placeholderData: (previousData) => previousData,
  });

  const overviewSection = coreQuery.data?.sections.overview ?? null;
  const chartSection = coreQuery.data?.sections.chart ?? null;
  const networkSection = coreQuery.data?.sections.network ?? null;
  const onChainActivitySection = slowQuery.data?.sections.onChainActivity ?? null;
  const sentimentSection = slowQuery.data?.sections.sentiment ?? null;
  const performanceSection = slowQuery.data?.sections.performance ?? null;
  const marketContextChartSection = slowQuery.data?.sections.marketContextChart ?? null;

  const overview = overviewSection?.data ?? null;
  const network = networkSection?.data ?? null;
  const sentiment = sentimentSection?.data ?? null;
  const onChainActivity = onChainActivitySection?.data ?? null;
  const chart = chartSection?.data ?? null;
  const performance = performanceSection?.data ?? null;
  const marketContextChart = marketContextChartSection?.data ?? null;
  const refetchCore = coreQuery.refetch;
  const refetchSlow = slowQuery.refetch;

  const overviewError = useMemo(
    () =>
      getBundledSectionErrorMessage(
        copy.stateCopy.fallbacks.overviewUnavailable,
        overviewSection?.error,
        coreQuery.error,
        locale
      ),
    [copy.stateCopy.fallbacks.overviewUnavailable, coreQuery.error, locale, overviewSection?.error]
  );
  const networkError = useMemo(
    () =>
      getBundledSectionErrorMessage(
        copy.stateCopy.fallbacks.networkUnavailable,
        networkSection?.error,
        coreQuery.error,
        locale
      ),
    [copy.stateCopy.fallbacks.networkUnavailable, coreQuery.error, locale, networkSection?.error]
  );
  const chartError = useMemo(
    () =>
      getBundledSectionErrorMessage(
        copy.stateCopy.fallbacks.chartUnavailable,
        chartSection?.error,
        coreQuery.error,
        locale
      ),
    [chartSection?.error, copy.stateCopy.fallbacks.chartUnavailable, coreQuery.error, locale]
  );
  const sentimentError = useMemo(
    () =>
      getBundledSectionErrorMessage(
        copy.stateCopy.fallbacks.sentimentUnavailable,
        sentimentSection?.error,
        slowQuery.error,
        locale
      ),
    [
      copy.stateCopy.fallbacks.sentimentUnavailable,
      locale,
      sentimentSection?.error,
      slowQuery.error,
    ]
  );
  const performanceError = useMemo(
    () =>
      getBundledSectionErrorMessage(
        copy.stateCopy.fallbacks.performanceUnavailable,
        performanceSection?.error,
        slowQuery.error,
        locale
      ),
    [
      copy.stateCopy.fallbacks.performanceUnavailable,
      locale,
      performanceSection?.error,
      slowQuery.error,
    ]
  );
  const marketContextChartError = useMemo(
    () =>
      getBundledSectionErrorMessage(
        copy.stateCopy.fallbacks.chartUnavailable,
        marketContextChartSection?.error,
        slowQuery.error,
        locale
      ),
    [
      copy.stateCopy.fallbacks.chartUnavailable,
      locale,
      marketContextChartSection?.error,
      slowQuery.error,
    ]
  );
  const onChainActivityError = useMemo(
    () =>
      getBundledSectionErrorMessage(
        copy.stateCopy.fallbacks.onChainActivityUnavailable,
        onChainActivitySection?.error,
        slowQuery.error,
        locale
      ),
    [
      copy.stateCopy.fallbacks.onChainActivityUnavailable,
      locale,
      onChainActivitySection?.error,
      slowQuery.error,
    ]
  );

  const overviewLoading = coreQuery.isPending;
  const networkLoading = coreQuery.isPending;
  const chartLoading = coreQuery.isPending;
  const sentimentLoading = slowQuery.isPending;
  const onChainActivityLoading = slowQuery.isPending;
  const performanceLoading = slowQuery.isPending;
  const marketContextChartLoading = slowQuery.isPending;

  const loadOverviewData = useCallback(
    async (_selectedCurrency: Currency) => {
      const result = await refetchCore();
      return result.data?.sections.overview.data?.fetchedAt ?? null;
    },
    [refetchCore]
  );

  const loadNetworkData = useCallback(
    async (_options?: { silent?: boolean }) => {
      const result = await refetchCore();
      return result.data?.sections.network.data?.fetchedAt ?? null;
    },
    [refetchCore]
  );

  const loadSentimentData = useCallback(async () => {
    const result = await refetchSlow();
    return result.data?.sections.sentiment.data?.fetchedAt ?? null;
  }, [refetchSlow]);

  const loadOnChainActivityData = useCallback(async () => {
    const result = await refetchSlow();
    return result.data?.sections.onChainActivity.data?.fetchedAt ?? null;
  }, [refetchSlow]);

  const loadChartData = useCallback(
    async (_selectedRange: ChartRange, _selectedCurrency: Currency) => {
      const result = await refetchCore();
      return result.data?.sections.chart.data?.fetchedAt ?? null;
    },
    [refetchCore]
  );

  const loadPerformanceData = useCallback(
    async (_selectedCurrency: Currency) => {
      const result = await refetchSlow();
      return result.data?.sections.performance.data?.fetchedAt ?? null;
    },
    [refetchSlow]
  );

  const loadMarketContextChartData = useCallback(
    async (_selectedCurrency: Currency) => {
      const result = await refetchSlow();
      return result.data?.sections.marketContextChart.data?.fetchedAt ?? null;
    },
    [refetchSlow]
  );

  const refreshCoreSections = useCallback(async () => {
    setRefreshing(true);

    try {
      await refetchCore();
    } finally {
      setRefreshing(false);
    }
  }, [refetchCore]);

  const refreshSlowSections = useCallback(async () => {
    setRefreshing(true);

    try {
      await refetchSlow();
    } finally {
      setRefreshing(false);
    }
  }, [refetchSlow]);

  const refreshAll = useCallback(
    async (_selectedRange: ChartRange, _selectedCurrency: Currency) => {
      setRefreshing(true);

      try {
        await Promise.all([refetchCore(), refetchSlow()]);
      } finally {
        setRefreshing(false);
      }
    },
    [refetchCore, refetchSlow]
  );

  const pollingEnabled = autoRefresh && isDocumentVisible && isActivePollingTab;

  useEffect(() => {
    if (!pollingEnabled) return;

    const timerId = window.setInterval(() => {
      void refreshCoreSections();
    }, DASHBOARD_CORE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, [pollingEnabled, refreshCoreSections]);

  useEffect(() => {
    if (!pollingEnabled) return;

    const timerId = window.setInterval(() => {
      void refreshSlowSections();
    }, DASHBOARD_SLOW_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, [pollingEnabled, refreshSlowSections]);

  const overviewMetrics = useMemo(
    () =>
      overview
        ? [
            overview.price,
            overview.change24h,
            overview.volume24h,
            overview.marketCap,
            overview.marketCapRank,
            overview.fullyDilutedValuation,
            overview.circulatingSupply,
            overview.maxSupply,
            overview.supplyProgressPercent,
            overview.ath,
            overview.athChangePercent,
            overview.atl,
            overview.atlChangePercent,
            overview.high24h,
            overview.low24h,
            overview.marketCapChange24h,
            overview.marketCapChange24hPercent,
            overview.volumeMarketCapRatio,
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
            network.mempool.backlogBlocks,
            network.activity.averageBlockTimeMinutes,
            network.activity.averageTransactionsPerBlock,
            network.activity.averageBlockSizeBytes,
            network.feeSpread.fastestToHour,
            network.feeSpread.hourToMinimum,
            network.feeSpread.fastestToMinimum,
          ]
        : [],
    [network]
  );

  const halvingMetrics = useMemo(
    () =>
      network
        ? [
            network.halving.progressPercent,
            network.halving.estimatedDaysUntil,
            network.halving.remainingBlocks,
            network.halving.nextHalvingHeight,
            network.halving.currentReward,
            network.halving.nextReward,
          ]
        : [],
    [network]
  );

  const sentimentMetrics = useMemo(
    () =>
      sentiment
        ? [
            sentiment.value,
            sentiment.average7d,
            sentiment.change7d,
            sentiment.classification,
            sentiment.timeUntilUpdateSeconds,
            sentiment.nextUpdateAt,
          ]
        : [],
    [sentiment]
  );

  const onChainActivityMetrics = useMemo(
    () =>
      onChainActivity
        ? [
            onChainActivity.activeAddresses.current,
            onChainActivity.activeAddresses.change7dPercent,
            onChainActivity.activeAddresses.average7d,
            onChainActivity.nonZeroAddresses.current,
            onChainActivity.nonZeroAddresses.change7dPercent,
            onChainActivity.nonZeroAddresses.average7d,
            onChainActivity.transactionCount.current,
            onChainActivity.transactionCount.change7dPercent,
            onChainActivity.transactionCount.average7d,
            onChainActivity.transferCount.current,
            onChainActivity.transferCount.change7dPercent,
            onChainActivity.transferCount.average7d,
            onChainActivity.dailyFeesBtc.current,
            onChainActivity.dailyFeesBtc.change7dPercent,
            onChainActivity.dailyFeesBtc.average7d,
            onChainActivity.derived.transfersPerTransaction,
            onChainActivity.derived.nonZeroAddressesChange7dPercent,
            onChainActivity.derived.averageDailyFees7dBtc,
          ]
        : [],
    [onChainActivity]
  );

  const hasOverviewData = overviewMetrics.some((value) => value !== null);
  const hasNetworkData = networkMetrics.some((value) => value !== null);
  const hasHalvingData = halvingMetrics.some((value) => value !== null);
  const hasSentimentData = sentimentMetrics.some((value) => value !== null);
  const hasOnChainActivityData = onChainActivityMetrics.some((value) => value !== null);
  const hasChartData = chart !== null && chart.points.length > 0;
  const performanceMetrics = useMemo(
    () =>
      performance
        ? [
            ...performance.periods.map((period) => period.changePercent),
            performance.stats.high52w.price,
            performance.stats.low52w.price,
            performance.stats.distanceFromHigh52wPercent,
            performance.stats.movingAverage200d,
            performance.stats.distanceFromMovingAverage200dPercent,
            performance.stats.volatility30dPercent,
            performance.stats.volatility90dPercent,
          ]
        : [],
    [performance]
  );
  const hasPerformanceData = performanceMetrics.some((value) => value !== null);
  const hasMarketContextChartData = Boolean(
    marketContextChart?.series.some((series) => series.points.length > 0)
  );
  const noticeCandidates = useMemo(
    () =>
      getDashboardNoticeCandidates({
        locale,
        network,
        networkState: {
          error: networkError,
          hasUsableData: hasNetworkData,
          isLoading: networkLoading,
        },
      }),
    [hasNetworkData, locale, network, networkError, networkLoading]
  );
  const warnings = usePersistentNoticeMessages(noticeCandidates, PERSISTENT_NOTICE_DELAY_MS);

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

  const halvingState = useMemo(
    () =>
      resolveAsyncDataState({
        data: network,
        error: networkError,
        hasUsableData: hasHalvingData,
        isEmpty: network !== null && !hasHalvingData,
        isLoading: networkLoading,
        isPartial:
          Boolean(network?.partial) ||
          (hasHalvingData && halvingMetrics.some((value) => value === null)),
        lastUpdatedAt: network?.fetchedAt ?? null,
      }),
    [halvingMetrics, hasHalvingData, network, networkError, networkLoading]
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

  const onChainActivityState = useMemo(
    () =>
      resolveAsyncDataState({
        data: onChainActivity,
        error: onChainActivityError,
        hasUsableData: hasOnChainActivityData,
        isEmpty: onChainActivity !== null && !hasOnChainActivityData,
        isLoading: onChainActivityLoading,
        isPartial:
          Boolean(onChainActivity?.partial) ||
          (hasOnChainActivityData && onChainActivityMetrics.some((value) => value === null)),
        lastUpdatedAt: onChainActivity?.fetchedAt ?? null,
      }),
    [
      hasOnChainActivityData,
      onChainActivity,
      onChainActivityError,
      onChainActivityLoading,
      onChainActivityMetrics,
    ]
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
          (hasPerformanceData && performanceMetrics.some((value) => value === null)),
        lastUpdatedAt: performance?.fetchedAt ?? null,
      }),
    [hasPerformanceData, performance, performanceError, performanceLoading, performanceMetrics]
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
        onChainActivity?.fetchedAt,
        chart?.fetchedAt,
        performance?.fetchedAt,
        marketContextChart?.fetchedAt,
      ]),
    [
      chart?.fetchedAt,
      marketContextChart?.fetchedAt,
      network?.fetchedAt,
      onChainActivity?.fetchedAt,
      overview?.fetchedAt,
      performance?.fetchedAt,
      sentiment?.fetchedAt,
    ]
  );

  const pendingVisibilityRefreshRef = useRef(false);

  useEffect(() => {
    if (!isDocumentVisible) {
      pendingVisibilityRefreshRef.current = true;
      return;
    }

    if (autoRefresh && pendingVisibilityRefreshRef.current && lastRefreshAt !== null) {
      pendingVisibilityRefreshRef.current = false;
      void refreshAll(range, currency);
    }
  }, [autoRefresh, currency, isDocumentVisible, lastRefreshAt, range, refreshAll]);

  const didMountRef = useRef(false);
  const previousLeaderRef = useRef(isActivePollingTab);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      previousLeaderRef.current = isActivePollingTab;
      return;
    }

    const becamePollingLeader = !previousLeaderRef.current && isActivePollingTab;
    previousLeaderRef.current = isActivePollingTab;

    if (becamePollingLeader && isDocumentVisible && autoRefresh && lastRefreshAt !== null) {
      void refreshAll(range, currency);
    }
  }, [
    autoRefresh,
    currency,
    isActivePollingTab,
    isDocumentVisible,
    lastRefreshAt,
    range,
    refreshAll,
  ]);

  const dashboardState = useMemo(
    () =>
      resolveAsyncDataState({
        data: lastRefreshAt ? { lastRefreshAt } : null,
        error: [
          overviewError,
          networkError,
          onChainActivityError,
          sentimentError,
          chartError,
          performanceError,
          marketContextChartError,
        ].find(Boolean),
        hasUsableData:
          overviewState.hasUsableData ||
          halvingState.hasUsableData ||
          networkState.hasUsableData ||
          onChainActivityState.hasUsableData ||
          sentimentState.hasUsableData ||
          chartState.hasUsableData ||
          performanceState.hasUsableData ||
          marketContextChartState.hasUsableData,
        isLoading: refreshing && !lastRefreshAt,
        isPartial:
          overviewState.status === "partial" ||
          halvingState.status === "partial" ||
          networkState.status === "partial" ||
          onChainActivityState.status === "partial" ||
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
      halvingState.hasUsableData,
      halvingState.status,
      lastRefreshAt,
      marketContextChartError,
      marketContextChartState.hasUsableData,
      marketContextChartState.status,
      networkError,
      networkState.hasUsableData,
      networkState.status,
      onChainActivityError,
      onChainActivityState.hasUsableData,
      onChainActivityState.status,
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
    halvingState,
    lastRefreshAt,
    marketContextChart,
    marketContextChartState,
    network,
    networkError,
    networkLoading,
    networkState,
    onChainActivity,
    onChainActivityState,
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
    loadOnChainActivityData,
    loadOverviewData,
    loadPerformanceData,
    loadSentimentData,
    loadChartData,
    loadMarketContextChartData,
    refreshAll,
  };
}
