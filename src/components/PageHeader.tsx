import SectionHeader from "./ui/layout/SectionHeader";

export default function PageHeader() {
  return (
    <header>
      <SectionHeader
        eyebrow="Live Dashboard"
        title={
          <>
            Bitcoin <span className="text-accent">deutlich</span> klarer.
          </>
        }
        titleAs="h1"
        titleSize="lg"
        description="Kompakter Einstieg vor dem Dashboard: schnelle Einordnung, saubere Typohierarchie und gezielte Akzentflaechen statt Effekten."
        className="max-w-3xl border-b-0 pb-0"
      />
    </header>
  );
}
