import { useState } from 'react'
import { MetricCard, PageHeading, PlaceholderCard } from '@/components/dashboard'
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
        <PlaceholderCard
          className="col-span-12 xl:col-span-4"
          title="Sats-Rechner"
          description="Die Umrechnung zwischen Bitcoin, Satoshis und Fiat-Währungen folgt in einem späteren Schritt."
        />
        {[
          ['BTC-Dominanz', '%'],
          ['Fear & Greed', '/ 100'],
        ].map(([label, unit]) => (
          <MetricCard key={label} label={label} unit={unit} />
        ))}
      </div>
    </>
  )
}
