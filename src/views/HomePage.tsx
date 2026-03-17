"use client";

import NoticeBar from "../components/NoticeBar";
import PageHeader from "../components/PageHeader";
import Stack from "../components/ui/layout/Stack";
import { useDashboardData } from "../hooks/useDashboardData";
import DashboardContent from "./dashboard/DashboardContent";
import DashboardControlsSection from "./dashboard/DashboardControlsSection";

export default function HomePage() {
  const {
    autoRefresh,
    chart,
    chartError,
    chartLoading,
    currency,
    loadChartData,
    loadNetworkData,
    loadOverviewData,
    loadSentimentData,
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
    showChartSkeleton,
    showNetworkSkeleton,
    showOverviewSkeleton,
    showSentimentSkeleton,
    warnings,
    refreshAll,
    setAutoRefresh,
    setCurrency,
    setRange,
  } = useDashboardData();

  return (
    <Stack gap="xl">
      <PageHeader />

      <DashboardControlsSection
        autoRefresh={autoRefresh}
        currency={currency}
        lastRefreshAt={lastRefreshAt}
        refreshing={refreshing}
        onAutoRefreshChange={setAutoRefresh}
        onCurrencyChange={setCurrency}
        onRefresh={() => void refreshAll(range, currency)}
      />

      <NoticeBar warnings={warnings} />

      <DashboardContent
        chart={chart}
        chartError={chartError}
        chartLoading={chartLoading}
        currency={currency}
        network={network}
        networkError={networkError}
        networkLoading={networkLoading}
        overview={overview}
        overviewError={overviewError}
        overviewLoading={overviewLoading}
        range={range}
        sentiment={sentiment}
        sentimentError={sentimentError}
        sentimentLoading={sentimentLoading}
        showChartSkeleton={showChartSkeleton}
        showNetworkSkeleton={showNetworkSkeleton}
        showOverviewSkeleton={showOverviewSkeleton}
        showSentimentSkeleton={showSentimentSkeleton}
        onChartRetry={() => void loadChartData(range, currency)}
        onNetworkRetry={() => void loadNetworkData()}
        onOverviewRetry={() => void loadOverviewData()}
        onSentimentRetry={() => void loadSentimentData()}
        onRangeChange={setRange}
      />
    </Stack>
  );
}
