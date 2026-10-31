import { MetricCard, PageHeading, PlaceholderCard, PriceChart } from '@/components/dashboard'
import { MarketSnapshot } from '@/components/market/snapshot'

export default function Market() {
  return (
    <>
      <PageHeading
        title="Markt"
        description="Kursentwicklung, Bewertung und Marktstimmung."
        sourceLabel="Marktsnapshot · CoinGecko"
      />
      <MarketSnapshot />
      <div className="dashboard-grid">
        <PriceChart />
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
