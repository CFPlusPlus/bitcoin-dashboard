"use client";

import { useI18n } from "../i18n/context";
import Stack from "../components/ui/layout/Stack";
import { useDashboardData } from "../hooks/useDashboardData";
import DashboardContent from "./dashboard/DashboardContent";
import HomepageIntro from "./dashboard/HomepageIntro";

export default function HomePage() {
  const { locale } = useI18n();
  const {
    autoRefresh,
    chart,
    chartState,
    currency,
    dashboardState,
    loadChartData,
    loadMarketContextChartData,
    loadNetworkData,
    loadOverviewData,
    loadPerformanceData,
    marketContextChart,
    marketContextChartState,
    loadSentimentData,
    network,
    networkState,
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
    setCurrency,
    setRange,
  } = useDashboardData(locale);

  return (
    <Stack gap="xl">
      <HomepageIntro
        autoRefresh={autoRefresh}
        currency={currency}
        dashboardState={dashboardState}
        refreshing={refreshing}
        onAutoRefreshChange={setAutoRefresh}
        onCurrencyChange={setCurrency}
        onRefresh={() => void refreshAll(range, currency)}
        warnings={warnings}
      />

      <DashboardContent
        chart={chart}
        chartState={chartState}
        currency={currency}
        dashboardState={dashboardState}
        marketContextChart={marketContextChart}
        marketContextChartState={marketContextChartState}
        network={network}
        networkState={networkState}
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
        onOverviewRetry={() => void loadOverviewData()}
        onPerformanceRetry={() => void loadPerformanceData(currency)}
        onSentimentRetry={() => void loadSentimentData()}
        onRangeChange={setRange}
      />
    </Stack>
  );
}
