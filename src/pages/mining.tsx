import { MetricCard, PageHeading, PlaceholderCard } from '@/components/dashboard'

export default function Mining() {
  return (
    <>
      <PageHeading
        title="Netzwerk & Mining"
        description="Rechenleistung, Mining und das Bitcoin-Angebot."
      />
      <div className="dashboard-grid">
        {[
          ['Hashrate', 'EH/s'],
          ['Difficulty', 'T'],
          ['Nächste Anpassung', '%'],
          ['Bitcoin-Angebot', 'BTC'],
          ['Inflationsrate', '% p. a.'],
          ['Nächstes Halving', 'Blöcke'],
        ].map(([label, unit]) => (
          <MetricCard key={label} label={label} unit={unit} />
        ))}
        <PlaceholderCard
          className="col-span-12 lg:col-span-8"
          title="Hashrate & Difficulty"
          description="Historische Entwicklung der Rechenleistung und Mining-Schwierigkeit."
        />
        <PlaceholderCard
          className="col-span-12 lg:col-span-4"
          title="Mining-Pools"
          description="Verteilung der gefundenen Blöcke auf Mining-Pools."
        />
        <PlaceholderCard
          className="col-span-12 lg:col-span-6"
          title="Halving"
          description="Blocksubvention und Fortschritt zum nächsten Halving."
        />
        <PlaceholderCard
          className="col-span-12 lg:col-span-6"
          title="Bitcoin-Angebot"
          description="Umlaufmenge, verbleibendes Angebot und Inflationsrate."
        />
      </div>
    </>
  )
}
