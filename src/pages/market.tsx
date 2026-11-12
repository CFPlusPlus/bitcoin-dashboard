import { useState } from 'react'
import { PageHeading } from '@/components/dashboard'
import { ErrorBoundary } from '@/components/error-boundary'
import { SatsCalculator } from '@/components/market/sats-calculator'
import { MarketIndicatorCard } from '@/components/market/indicator'
import { MarketSnapshot } from '@/components/market/snapshot'
import { MarketHistory } from '@/components/market/history'
import type { Currency } from '../../shared/market'

export default function Market() {
  const [currency, setCurrency] = useState<Currency>('usd')
  return (
    <>
      <PageHeading
        title="Markt"
        description="Kursentwicklung, Bewertung und Marktstimmung."
        sourceLabel="Marktsnapshot · CoinGecko"
      />
      <MarketSnapshot currency={currency} onCurrencyChange={setCurrency} />
      <div className="dashboard-grid">
        <MarketHistory currency={currency} />
        <ErrorBoundary scope="card" className="col-span-12 xl:col-span-4">
          <SatsCalculator />
        </ErrorBoundary>
        <ErrorBoundary scope="card" className="col-span-12 md:col-span-6">
          <MarketIndicatorCard resource="dominance" />
        </ErrorBoundary>
        <ErrorBoundary scope="card" className="col-span-12 md:col-span-6">
          <MarketIndicatorCard resource="fear-greed" />
        </ErrorBoundary>
      </div>
    </>
  )
}
