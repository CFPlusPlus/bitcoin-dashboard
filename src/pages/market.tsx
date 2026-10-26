import { MetricCard, PageHeading, PlaceholderCard, PriceChart } from '@/components/dashboard'

export default function Market() {
  return <><PageHeading title="Markt" description="Kursentwicklung, Bewertung und Marktstimmung." /><div className="dashboard-grid">
    {[['Bitcoin-Kurs', 'USD'], ['Marktkapitalisierung', 'USD'], ['Handelsvolumen · 24 h', 'USD'], ['Allzeithoch (ATH)', 'USD'], ['BTC-Dominanz', '%'], ['Fear & Greed', '/ 100']].map(([label, unit]) => <MetricCard key={label} label={label} unit={unit} />)}
    <PriceChart /><PlaceholderCard className="col-span-12 xl:col-span-4" title="Sats-Rechner" description="Die Umrechnung zwischen Bitcoin, Satoshis und Fiat-Währungen folgt in einem späteren Schritt." />
  </div></>
}
