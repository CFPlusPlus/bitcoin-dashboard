import Section from "../components/ui/layout/Section";
import SectionHeader from "../components/ui/layout/SectionHeader";
import ToolTeaserCard from "../components/ui/patterns/ToolTeaserCard";
import { toolCards } from "../data/tools";

export default function ToolsPage() {
  return (
    <Section space="lg">
      <SectionHeader
        eyebrow="Tools"
        title="Interaktive Bitcoin-Werkzeuge"
        description="Das Dashboard bleibt dein Ueberblick. Auf den Tool-Seiten bekommen Rechner und Experimente ihren eigenen Platz mit mehr Raum fuer Eingaben, Erklaerungen und Ergebnisse."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {toolCards.map((tool) => (
          <ToolTeaserCard
            key={tool.slug}
            category={tool.category}
            description={tool.description}
            href={tool.href}
            tags={tool.tags}
            title={tool.title}
          />
        ))}
      </div>
    </Section>
  );
}
