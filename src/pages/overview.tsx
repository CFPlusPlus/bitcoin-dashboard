import { useState } from 'react'
import { PageHeading } from '@/components/dashboard'
import { LiveBlocksTable, MempoolCard } from '@/components/bitcoin-data'
import { ErrorBoundary } from '@/components/error-boundary'
import { MarketHistory } from '@/components/market/history'
import { LivePrices } from '@/components/overview/live-prices'
import { HalvingCard, HashrateCard, OverviewChainMetric } from '@/components/overview/network'
import { OverviewMarketMetrics } from '@/components/overview/market-metrics'
import { useGreeting } from '@/lib/overview'
import type { Currency } from '../../shared/market'
import '@/styles/market.css'
import '@/styles/overview.css'

export default function Overview() {
  const greeting = useGreeting()
  const [currency, setCurrency] = useState<Currency>('eur')
  return (
    <>
      <PageHeading
        title="Übersicht"
        heading={greeting}
        description="Dein Bitcoin-Netzwerk und die Märkte im Überblick."
        sourceLabel="Markt & Netzwerk"
      />
      <div className="overview-layout">
        <ErrorBoundary scope="card">
          <LivePrices />
        </ErrorBoundary>
        <div className="overview-section-head overview-currency-control">
          <h2 className="section-title">Markt & Netzwerk</h2>
          <div className="market-controls">
            <label>
              Marktkennzahlen & Chart{' '}
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as Currency)}
              >
                <option value="eur">EUR</option>
                <option value="usd">USD</option>
              </select>
            </label>
          </div>
        </div>
        <div className="overview-metrics">
          <ErrorBoundary scope="card" className="overview-market-error">
            <OverviewMarketMetrics currency={currency} />
          </ErrorBoundary>
          <OverviewChainMetric kind="height" />
          <ErrorBoundary scope="card">
            <HashrateCard />
          </ErrorBoundary>
          <OverviewChainMetric kind="fees" />
        </div>
        <div className="overview-analysis">
          <ErrorBoundary scope="card" className="overview-history">
            <MarketHistory currency={currency} />
          </ErrorBoundary>
          <div className="overview-context">
            <ErrorBoundary scope="card">
              <HalvingCard />
            </ErrorBoundary>
            <MempoolCard className="overview-mempool" />
          </div>
        </div>
        <LiveBlocksTable className="overview-blocks" />
      </div>
    </>
  )
}
