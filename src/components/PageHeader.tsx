import SectionHeader from "./ui/layout/SectionHeader";

export default function PageHeader() {
  return (
    <header>
      <SectionHeader
        eyebrow="MVP+"
        title="Bitcoin Dashboard"
        titleAs="h1"
        titleSize="xl"
        description="Marktdaten ueber CoinGecko, Netzwerkdaten ueber mempool.space und Sentiment ueber Alternative.me. Einstellungen bleiben jetzt auf diesem Geraet gespeichert."
        className="max-w-4xl"
      />
    </header>
  );
}
