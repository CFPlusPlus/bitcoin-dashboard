import SectionHeader from "./ui/layout/SectionHeader";

export default function PageHeader() {
  return (
    <header>
      <SectionHeader
        eyebrow="Bitcoin Dashboard"
        title={
          <>
            Bitcoin auf einen <span className="text-accent">ruhigen Blick</span>.
          </>
        }
        titleAs="h1"
        titleSize="lg"
        description="Preis, 24h-Bewegung, Chart, Marktstimmung und wichtige Bitcoin-Signale in einer klaren Startansicht."
        className="max-w-3xl border-b-0 pb-0"
      />
    </header>
  );
}
