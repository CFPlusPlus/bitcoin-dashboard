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
    chartState,
    currency,
    dashboardState,
    loadChartData,
    loadNetworkData,
    loadOverviewData,
    loadSentimentData,
    network,
    networkState,
    overview,
    overviewState,
    range,
    refreshing,
    sentiment,
    sentimentState,
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
        dashboardState={dashboardState}
        refreshing={refreshing}
        onAutoRefreshChange={setAutoRefresh}
        onCurrencyChange={setCurrency}
        onRefresh={() => void refreshAll(range, currency)}
      />

      <NoticeBar warnings={warnings} />

      <DashboardContent
        chart={chart}
        chartState={chartState}
        currency={currency}
        network={network}
        networkState={networkState}
        overview={overview}
        overviewState={overviewState}
        range={range}
        sentiment={sentiment}
        sentimentState={sentimentState}
        onChartRetry={() => void loadChartData(range, currency)}
        onNetworkRetry={() => void loadNetworkData()}
        onOverviewRetry={() => void loadOverviewData()}
        onSentimentRetry={() => void loadSentimentData()}
        onRangeChange={setRange}
      />
    </Stack>
  );
}
