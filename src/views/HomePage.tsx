"use client";

import { useI18n } from "../i18n/context";
import Stack from "../components/ui/layout/Stack";
import { useDashboardData } from "../hooks/useDashboardData";
import BitcoinNowSection from "./dashboard/BitcoinNowSection";
import DashboardContent from "./dashboard/DashboardContent";

export default function HomePage() {
  const { locale } = useI18n();
  const {
    autoRefresh,
    chart,
    chartState,
    currency,
    dashboardState,
    halvingState,
    loadChartData,
    loadMarketContextChartData,
    loadNetworkData,
    loadOnChainActivityData,
    loadOverviewData,
    loadPerformanceData,
    marketContextChart,
    marketContextChartState,
    loadSentimentData,
    network,
    networkState,
    onChainActivity,
    onChainActivityState,
    overview,
    overviewState,
    performance,
    performanceState,
    range,
    refreshing,
    sentiment,
    sentimentState,
    warnings,
    refreshAll,
    setAutoRefresh,
    setRange,
  } = useDashboardData(locale);

  return (
    <Stack gap="xl">
      <BitcoinNowSection
        autoRefresh={autoRefresh}
        chart={chart}
        chartState={chartState}
        currency={currency}
        dashboardState={dashboardState}
        halvingState={halvingState}
        network={network}
        networkState={networkState}
        refreshing={refreshing}
        onAutoRefreshChange={setAutoRefresh}
        onChartRetry={() => void loadChartData(range, currency)}
        onNetworkRetry={() => void loadNetworkData()}
        onOverviewRetry={() => void loadOverviewData(currency)}
        onRangeChange={setRange}
        onRefresh={() => void refreshAll(range, currency)}
        onSentimentRetry={() => void loadSentimentData()}
        overview={overview}
        overviewState={overviewState}
        range={range}
        sentiment={sentiment}
        sentimentState={sentimentState}
        warnings={warnings}
      />

      <DashboardContent
        chart={chart}
        chartState={chartState}
        currency={currency}
        dashboardState={dashboardState}
        halvingState={halvingState}
        marketContextChart={marketContextChart}
        marketContextChartState={marketContextChartState}
        network={network}
        networkState={networkState}
        onChainActivity={onChainActivity}
        onChainActivityState={onChainActivityState}
        overview={overview}
        overviewState={overviewState}
        performance={performance}
        performanceState={performanceState}
        range={range}
        sentiment={sentiment}
        sentimentState={sentimentState}
        onChartRetry={() => void loadChartData(range, currency)}
        onDashboardRetry={() => void refreshAll(range, currency)}
        onMarketContextChartRetry={() => void loadMarketContextChartData(currency)}
        onNetworkRetry={() => void loadNetworkData()}
        onOnChainActivityRetry={() => void loadOnChainActivityData()}
        onOverviewRetry={() => void loadOverviewData(currency)}
        onPerformanceRetry={() => void loadPerformanceData(currency)}
        onSentimentRetry={() => void loadSentimentData()}
        onRangeChange={setRange}
      />
    </Stack>
  );
}
