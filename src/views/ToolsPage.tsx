import Link from "next/link";
import { buttonVariants } from "../components/ui/Button";
import Card from "../components/ui/Card";
import MetaText from "../components/ui/content/MetaText";
import Section from "../components/ui/layout/Section";
import SectionHeader from "../components/ui/layout/SectionHeader";
import Stack from "../components/ui/layout/Stack";
import ToolTeaserCard from "../components/ui/patterns/ToolTeaserCard";
import { toolCards } from "../data/tools";
import { cn } from "../lib/cn";

export default function ToolsPage() {
  const featuredTool = toolCards[0];

  return (
    <Section space="lg">
      <SectionHeader
        eyebrow="Werkzeuge"
        title="Werkzeuge, die wirklich helfen"
        description="Weniger Auswahl, mehr Nutzen. Hier beginnen die Bitcoin-Werkzeuge, die du direkt verwenden kannst."
        action={
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
            DCA-Rechner öffnen
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
        <Card as="article" tone="muted" padding="lg">
          <SectionHeader
            eyebrow="Klarer Fokus"
            title="Weniger reden, mehr nutzen"
            titleAs="h2"
            titleSize="md"
            description="Hier geht es nicht um mehr Inhalt, sondern um bessere Entscheidungen."
            className="gap-3 sm:flex-col sm:justify-start"
          />

          <div className="grid gap-3 md:grid-cols-3">
            <Card as="section" tone="default" padding="md" gap="sm">
              <MetaText tone="strong">Schnell erfassbar</MetaText>
              <MetaText>
                Jedes Werkzeug löst eine klare Aufgabe ohne Umwege.
              </MetaText>
            </Card>

            <Card as="section" tone="default" padding="md" gap="sm">
              <MetaText tone="strong">Direkt nützlich</MetaText>
              <MetaText>
                Du sollst nach wenigen Sekunden wissen, was dir die Zahl bringt.
              </MetaText>
            </Card>

            <Card as="section" tone="default" padding="md" gap="sm">
              <MetaText tone="strong">Bewusst klein</MetaText>
              <MetaText>
                Neue Tools kommen nur dazu, wenn sie wirklich fehlen.
              </MetaText>
            </Card>
          </div>
        </Card>

        <Card as="article" tone="accent" padding="lg">
          <SectionHeader
            eyebrow="Jetzt ausprobieren"
            title="Der DCA-Rechner ist der Start"
            titleAs="h2"
            titleSize="md"
            description="Trag deine Käufe ein und sieh sofort Einstand, Bestand und Abstand zum Marktpreis."
            className="gap-3 sm:flex-col sm:justify-start"
          />

          <Stack gap="sm">
            <MetaText tone="strong">
              Ideal, wenn du regelmäßig sats stackst und wissen willst, wo du gerade stehst.
            </MetaText>
            <MetaText>Klar, schnell und ohne Ballast.</MetaText>
          </Stack>
        </Card>
      </div>

      <Section space="md" aria-label="Verfügbare Werkzeuge">
        <SectionHeader
          eyebrow="Aktuell live"
          title="Ein Werkzeug, das schon jetzt nützt"
          description="Der Bereich ist klein. Genau deshalb muss jedes Tool sitzen."
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

          <Card as="article" tone="muted" padding="md">
            <SectionHeader
              eyebrow="Nächster Ausbau"
              title="Mehr kommt später"
              titleAs="h3"
              titleSize="md"
              description="Neue Werkzeuge kommen erst, wenn sie einen echten Mehrwert bringen."
              className="gap-3 sm:flex-col sm:justify-start"
            />

            <Stack gap="sm" className="mt-auto">
              <MetaText tone="strong">
                Kein Katalog. Ein kleines Set guter Bitcoin-Helfer.
              </MetaText>
              <MetaText>Lieber ein starkes Werkzeug als zehn halbe.</MetaText>
            </Stack>
          </Card>
        </div>
      </Section>
    </Section>
  );
}
