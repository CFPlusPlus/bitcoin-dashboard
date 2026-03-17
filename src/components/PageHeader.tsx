import SectionHeader from "./ui/layout/SectionHeader";

export default function PageHeader() {
  return (
    <header>
      <SectionHeader
        eyebrow="Dashboard"
        title="Bitcoin in klarer Reihenfolge"
        titleAs="h1"
        titleSize="xl"
        description="Aktueller Preis, Hauptchart, Stimmung und Netzwerkdaten bleiben auf einer ruhigen Informationsflaeche gebuendelt. Daten kommen ueber CoinGecko, mempool.space und Alternative.me."
        className="max-w-3xl"
      />
    </header>
  );
}
