"use client";

import { useSearchParams } from "next/navigation";
import { useI18n } from "../i18n/context";
import { useDashboardData } from "../hooks/useDashboardData";
import { getDashboardSectionId } from "../lib/dashboard-workspace";
import DashboardContent from "./dashboard/DashboardContent";

export default function HomePage() {
  const { locale } = useI18n();
  const searchParams = useSearchParams();
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
  const section = getDashboardSectionId(searchParams?.get("section"));

  return (
    <DashboardContent
      autoRefresh={autoRefresh}
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
      refreshing={refreshing}
      section={section}
      sentiment={sentiment}
      sentimentState={sentimentState}
      warnings={warnings}
      onAutoRefreshChange={setAutoRefresh}
      onChartRetry={() => void loadChartData(range, currency)}
      onDashboardRetry={() => void refreshAll(range, currency)}
      onMarketContextChartRetry={() => void loadMarketContextChartData(currency)}
      onNetworkRetry={() => void loadNetworkData()}
      onOnChainActivityRetry={() => void loadOnChainActivityData()}
      onOverviewRetry={() => void loadOverviewData(currency)}
      onPerformanceRetry={() => void loadPerformanceData(currency)}
      onRangeChange={setRange}
      onRefresh={() => void refreshAll(range, currency)}
      onSentimentRetry={() => void loadSentimentData()}
    />
  );
}
