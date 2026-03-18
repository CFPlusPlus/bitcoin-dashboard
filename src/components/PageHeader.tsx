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
        description="Preis, Stimmung und Netzwerk in einer klaren Bitcoin-Ansicht."
        className="max-w-3xl border-b-0 pb-0"
      />
    </header>
  );
}
