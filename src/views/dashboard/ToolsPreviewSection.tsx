import Link from "next/link";
import { toolCards } from "../../data/tools";
import { cn } from "../../lib/cn";
import { buttonVariants } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import MetaText from "../../components/ui/content/MetaText";
import Section from "../../components/ui/layout/Section";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";
import ToolTeaserCard from "../../components/ui/patterns/ToolTeaserCard";

export default function ToolsPreviewSection() {
  const featuredTool = toolCards[0];

  return (
    <Section as="section" aria-label="Tools Vorschau" space="md">
      <SectionHeader
        eyebrow="Tools"
        title="Hilfswerkzeuge in Reichweite"
        description="Die Homepage bleibt eine Informationsflaeche. Werkzeuge sind erreichbar, ohne den Bitcoin-Ueberblick zu uebernehmen."
        action={
          <Link
            href="/tools"
            className={cn(
              buttonVariants({
                intent: "secondary",
                size: "sm",
              }),
              "no-underline"
            )}
          >
            Alle Tools
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(18rem,1.15fr)]">
        <Card as="article" tone="muted" className="justify-between">
          <SectionHeader
            eyebrow="Einordnung"
            title="Vom Lesen zum Rechnen"
            titleAs="h3"
            titleSize="md"
            description="Wenn der Marktueberblick steht, fuehren die Tools in einen eigenen Bereich mit mehr Raum fuer Interaktion und Eingaben."
            className="gap-3 sm:flex-col sm:justify-start"
          />

          <Stack gap="md">
            <MetaText tone="strong">
              Der DCA-Rechner ist direkt erreichbar, bleibt auf der Startseite aber bewusst nur
              ein naechster Schritt.
            </MetaText>
            <div className="flex flex-wrap gap-3">
              <Link
                href={featuredTool.href}
                className={cn(
                  buttonVariants({
                    intent: "primary",
                    size: "sm",
                  }),
                  "no-underline"
                )}
              >
                DCA-Rechner oeffnen
              </Link>
              <Link
                href="/tools"
                className={cn(
                  buttonVariants({
                    intent: "ghost",
                    size: "sm",
                  }),
                  "no-underline"
                )}
              >
                Zur Tool-Uebersicht
              </Link>
            </div>
          </Stack>
        </Card>

        <ToolTeaserCard
          category={featuredTool.category}
          description={featuredTool.description}
          href={featuredTool.href}
          tags={featuredTool.tags}
          title={featuredTool.title}
        />
      </div>
    </Section>
  );
}
