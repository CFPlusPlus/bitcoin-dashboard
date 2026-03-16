import DashboardOverviewSection from "../components/DashboardOverviewSection";
import DashboardToolbar from "../components/DashboardToolbar";
import ChartSection from "../components/ChartSection";
import MetadataSection from "../components/MetadataSection";
import NoticeBar from "../components/NoticeBar";
import PageHeader from "../components/PageHeader";
import { useDashboardData } from "../hooks/useDashboardData";

export default function DashboardPage() {
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

      <DashboardToolbar
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
        <section className="grid">
          <DashboardOverviewSection
            currency={currency}
            network={network}
            overview={overview}
            sentiment={sentiment}
            sentimentError={sentimentError}
            sentimentLoading={sentimentLoading}
            showSentimentSkeleton={showSentimentSkeleton}
          />

          <ChartSection
            chart={chart}
            chartError={chartError}
            chartLoading={chartLoading}
            currency={currency}
            range={range}
            showChartSkeleton={showChartSkeleton}
            onRangeChange={setRange}
          />

          <MetadataSection
            chart={chart}
            currency={currency}
            network={network}
            overview={overview}
            sentiment={sentiment}
          />
        </section>
      )}
    </>
  );
}
