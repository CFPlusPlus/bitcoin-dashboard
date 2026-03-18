import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJson } from "../lib/api";
import { normalizeDashboardWarningMessage, sanitizeDashboardErrorMessage } from "../lib/dashboard-state-copy";
import { getLatestSuccessfulUpdate, resolveAsyncDataState } from "../lib/data-state";
import type { ChartData, ChartRange, Currency, Network, Overview, Sentiment } from "../types/dashboard";
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

async function fetchOverview() {
  return fetchJson<Overview>("/api/overview");
}

async function fetchNetwork() {
  return fetchJson<Network>("/api/network");
}

async function fetchSentiment() {
  return fetchJson<Sentiment>("/api/sentiment");
}

async function fetchChart(range: ChartRange, currency: Currency) {
  return fetchJson<ChartData>(`/api/chart?days=${range}&currency=${currency}`);
}

function getSectionErrorMessage(
  fallback: string,
  error: unknown
) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  return sanitizeDashboardErrorMessage(error.message, fallback);
}

export function useDashboardData() {
  const chartRangeStateOptions = useMemo(() => ({ validator: isChartRange }), []);
  const currencyStateOptions = useMemo(() => ({ validator: isCurrency }), []);
  const autoRefreshStateOptions = useMemo(() => ({ validator: isBoolean }), []);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);

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

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [sentimentLoading, setSentimentLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const initialChartHandledRef = useRef(false);
  const initialRefreshHandledRef = useRef(false);

  const loadOverviewData = useCallback(async () => {
    setOverviewError("");
    setOverviewLoading(true);

    try {
      const overviewData = await fetchOverview();
      setOverview(overviewData);
      return overviewData.fetchedAt;
    } catch (error) {
      setOverviewError(
        getSectionErrorMessage(
          "Marktdaten sind gerade nicht verfuegbar. Bitte spaeter erneut laden.",
          error
        )
      );
      return null;
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadNetworkData = useCallback(async () => {
    setNetworkError("");
    setNetworkLoading(true);

    try {
      const networkData = await fetchNetwork();
      setNetwork(networkData);
      return networkData.fetchedAt;
    } catch (error) {
      setNetworkError(
        getSectionErrorMessage(
          "Netzwerkdaten sind gerade nicht verfuegbar. Bitte spaeter erneut laden.",
          error
        )
      );
      return null;
    } finally {
      setNetworkLoading(false);
    }
  }, []);

  const loadSentimentData = useCallback(async () => {
    setSentimentError("");
    setSentimentLoading(true);

    try {
      const sentimentData = await fetchSentiment();
      setSentiment(sentimentData);
      return sentimentData.fetchedAt;
    } catch (error) {
      setSentimentError(
        getSectionErrorMessage(
          "Sentimentdaten sind gerade nicht verfuegbar. Bitte spaeter erneut laden.",
          error
        )
      );
      return null;
    } finally {
      setSentimentLoading(false);
    }
  }, []);

  const loadChartData = useCallback(async (selectedRange: ChartRange, selectedCurrency: Currency) => {
    setChartError("");
    setChartLoading(true);

    try {
      const chartData = await fetchChart(selectedRange, selectedCurrency);
      setChart(chartData);
      return chartData.fetchedAt;
    } catch (error) {
      setChartError(
        getSectionErrorMessage(
          "Chartdaten sind gerade nicht verfuegbar. Bitte spaeter erneut laden.",
          error
        )
      );
      return null;
    } finally {
      setChartLoading(false);
    }
  }, []);

  const refreshAll = useCallback(
    async (selectedRange: ChartRange, selectedCurrency: Currency) => {
      setRefreshing(true);

      await Promise.all([
        loadOverviewData(),
        loadNetworkData(),
        loadChartData(selectedRange, selectedCurrency),
        loadSentimentData(),
      ]);

      setRefreshing(false);
    },
    [loadChartData, loadNetworkData, loadOverviewData, loadSentimentData]
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
    ]
      .map((warning) => normalizeDashboardWarningMessage(warning))
      .filter(Boolean);

    return [...new Set(items)];
  }, [chart, network, overview, sentiment]);

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

  const lastRefreshAt = useMemo(
    () =>
      getLatestSuccessfulUpdate([
        overview?.fetchedAt,
        network?.fetchedAt,
        sentiment?.fetchedAt,
        chart?.fetchedAt,
      ]),
    [chart?.fetchedAt, network?.fetchedAt, overview?.fetchedAt, sentiment?.fetchedAt]
  );

  const dashboardState = useMemo(
    () =>
      resolveAsyncDataState({
        data: lastRefreshAt ? { lastRefreshAt } : null,
        error: [overviewError, networkError, sentimentError, chartError].find(Boolean),
        hasUsableData:
          overviewState.hasUsableData ||
          networkState.hasUsableData ||
          sentimentState.hasUsableData ||
          chartState.hasUsableData,
        isLoading: refreshing && !lastRefreshAt,
        isPartial:
          overviewState.status === "partial" ||
          networkState.status === "partial" ||
          sentimentState.status === "partial" ||
          chartState.status === "partial",
        isRefreshing: refreshing && Boolean(lastRefreshAt),
        lastUpdatedAt: lastRefreshAt,
      }),
    [
      chartError,
      chartState.hasUsableData,
      chartState.status,
      lastRefreshAt,
      networkError,
      networkState.hasUsableData,
      networkState.status,
      overviewError,
      overviewState.hasUsableData,
      overviewState.status,
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
    network,
    networkError,
    networkLoading,
    networkState,
    overview,
    overviewError,
    overviewLoading,
    overviewState,
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
    loadSentimentData,
    loadChartData,
    refreshAll,
  };
}
