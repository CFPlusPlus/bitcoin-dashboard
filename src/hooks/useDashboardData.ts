import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJson } from "../lib/api";
import { usePersistentState } from "./usePersistentState";
import type {
  ChartData,
  ChartRange,
  Currency,
  Network,
  Overview,
  Sentiment,
} from "../types/dashboard";

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

export function useDashboardData() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);

  const [range, setRange] = usePersistentState<ChartRange>(
    STORAGE_KEYS.range,
    1,
    isChartRange
  );
  const [currency, setCurrency] = usePersistentState<Currency>(
    STORAGE_KEYS.currency,
    "usd",
    isCurrency
  );
  const [autoRefresh, setAutoRefresh] = usePersistentState<boolean>(
    STORAGE_KEYS.autoRefresh,
    true,
    isBoolean
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

  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

  const initialChartHandledRef = useRef(false);
  const initialRefreshHandledRef = useRef(false);

  const loadOverviewData = useCallback(async () => {
    setOverviewError("");
    setOverviewLoading(true);

    try {
      const overviewData = await fetchOverview();
      setOverview(overviewData);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Marktdaten konnten nicht geladen werden.";
      setOverviewError(message);
      return false;
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
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Netzwerkdaten konnten nicht geladen werden.";
      setNetworkError(message);
      return false;
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
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sentiment konnte nicht geladen werden.";
      setSentimentError(message);
      return false;
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
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Chartdaten konnten nicht geladen werden.";
      setChartError(message);
      return false;
    } finally {
      setChartLoading(false);
    }
  }, []);

  const refreshAll = useCallback(
    async (selectedRange: ChartRange, selectedCurrency: Currency) => {
      setRefreshing(true);

      const [overviewOk, networkOk, chartOk, sentimentOk] = await Promise.all([
        loadOverviewData(),
        loadNetworkData(),
        loadChartData(selectedRange, selectedCurrency),
        loadSentimentData(),
      ]);

      if (overviewOk && networkOk && chartOk && sentimentOk) {
        setLastRefreshAt(new Date().toISOString());
      }

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
    ];

    return [...new Set(items)];
  }, [chart, network, overview, sentiment]);

  return {
    autoRefresh,
    chart,
    chartError,
    chartLoading,
    currency,
    lastRefreshAt,
    network,
    networkError,
    networkLoading,
    overview,
    overviewError,
    overviewLoading,
    range,
    refreshing,
    sentiment,
    sentimentError,
    sentimentLoading,
    showNetworkSkeleton: !networkError && networkLoading && !network,
    showOverviewSkeleton: !overviewError && overviewLoading && !overview,
    showChartSkeleton: !chartError && chartLoading && !chart,
    showSentimentSkeleton: !sentimentError && sentimentLoading && !sentiment,
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
