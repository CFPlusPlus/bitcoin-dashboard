"use client";

import NoticeBar from "../components/NoticeBar";
import PageHeader from "../components/PageHeader";
import { useDashboardData } from "../hooks/useDashboardData";
import DashboardContent from "../views/dashboard/DashboardContent";
import DashboardControlsSection from "../views/dashboard/DashboardControlsSection";

export default function HomePage() {
  const {
    autoRefresh,
    baseError,
    chart,
    chartError,
    chartLoading,
    currency,
    lastRefreshAt,
    network,
    overview,
    range,
    refreshing,
    sentiment,
    sentimentError,
    sentimentLoading,
    showBaseSkeleton,
    showChartSkeleton,
    showSentimentSkeleton,
    warnings,
    refreshAll,
    setAutoRefresh,
    setCurrency,
    setRange,
  } = useDashboardData();

  return (
    <>
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

      {baseError && <div className="card error">Fehler: {baseError}</div>}
      {showBaseSkeleton && <div className="card">Lade Basisdaten...</div>}

      {overview && network && (
        <DashboardContent
          chart={chart}
          chartError={chartError}
          chartLoading={chartLoading}
          currency={currency}
          network={network}
          overview={overview}
          range={range}
          sentiment={sentiment}
          sentimentError={sentimentError}
          sentimentLoading={sentimentLoading}
          showChartSkeleton={showChartSkeleton}
          showSentimentSkeleton={showSentimentSkeleton}
          onRangeChange={setRange}
        />
      )}
    </>
  );
}
