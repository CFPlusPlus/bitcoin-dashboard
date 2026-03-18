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
        eyebrow="Tools"
        title="Bitcoin-Werkzeuge mit klarem Auftrag"
        description="Hier beginnt der Teil nach dem Ueberblick: rechnen, Eingaben pruefen und konkrete Bitcoin-Fragen sauber beantworten. Statt eines breiten Katalogs entsteht ein bewusst kleines Set an Werkzeugen, das fuer reale Entscheidungen nuetzlich bleibt."
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
            DCA-Rechner starten
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
        <Card as="article" tone="muted" padding="lg">
          <SectionHeader
            eyebrow="Wofuer dieser Bereich da ist"
            title="Werkzeuge bekommen ihren eigenen Raum"
            titleAs="h2"
            titleSize="md"
            description="Das Dashboard konzentriert sich auf Markt, Chart, Netzwerk und Sentiment. Im Tools-Bereich duerfen Eingaben, Szenarien und Rechenlogik mehr Platz einnehmen, ohne den Ueberblick unruhig zu machen."
            className="gap-3 sm:flex-col sm:justify-start"
          />

          <div className="grid gap-3 md:grid-cols-3">
            <Card as="section" tone="default" padding="md" gap="sm">
              <MetaText tone="strong">Fokussiert statt ueberladen</MetaText>
              <MetaText>
                Jedes Tool soll eine wiederkehrende Bitcoin-Aufgabe schnell und verstaendlich loesen.
              </MetaText>
            </Card>

            <Card as="section" tone="default" padding="md" gap="sm">
              <MetaText tone="strong">Praktisch im Alltag</MetaText>
              <MetaText>
                Der Nutzen steht vor Feature-Menge: weniger Spielerei, mehr klare Hilfen fuer echte Entscheidungen.
              </MetaText>
            </Card>

            <Card as="section" tone="default" padding="md" gap="sm">
              <MetaText tone="strong">Ruhig erweiterbar</MetaText>
              <MetaText>
                Neue Werkzeuge kommen nur dazu, wenn sie dauerhaft in diesen engen Bitcoin-Rahmen passen.
              </MetaText>
            </Card>
          </div>
        </Card>

        <Card as="article" tone="accent" padding="lg">
          <SectionHeader
            eyebrow="Erster vollstaendiger Baustein"
            title="Der DCA-Rechner setzt den Standard"
            titleAs="h2"
            titleSize="md"
            description="Er ist das erste komplett ausgearbeitete Tool in diesem Bereich: direkt nutzbar, klar erklaert und nah an einer typischen Bitcoin-Frage."
            className="gap-3 sm:flex-col sm:justify-start"
          />

          <Stack gap="sm">
            <MetaText tone="strong">
              Wenn du wiederkehrende Kaeufe dokumentierst, zeigt dir der Rechner deinen Einstand, deinen Bestand und den Abstand zum aktuellen Marktpreis.
            </MetaText>
            <MetaText>
              Genau so sollen weitere Werkzeuge spaeter funktionieren: spezifisch, leicht verstaendlich und ohne Produktballast.
            </MetaText>
          </Stack>
        </Card>
      </div>

      <Section space="md" aria-label="Verfuegbare Tools">
        <SectionHeader
          eyebrow="Aktuell live"
          title="Ein Werkzeug, klar positioniert"
          description="Der Bereich ist klein, aber nicht vorlaeufig. Jedes vorhandene Tool soll einen echten Platz im Produkt haben und sofort sinnvoll nutzbar sein."
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
              eyebrow="Naechster Ausbau"
              title="Wachstum bleibt bewusst ruhig"
              titleAs="h3"
              titleSize="md"
              description="Die Tools-Seite soll mit der Zeit nuetzlicher werden, nicht nur lauter. Weitere Eintraege kommen nur dann, wenn sie eine klare Bitcoin-Aufgabe besser loesen als das Dashboard allein."
              className="gap-3 sm:flex-col sm:justify-start"
            />

            <Stack gap="sm" className="mt-auto">
              <MetaText tone="strong">
                Das Ziel ist kein moeglichst grosses Verzeichnis, sondern ein kleines Arsenal verlaesslicher Bitcoin-Hilfen.
              </MetaText>
              <MetaText>
                Solange diese Linie klar bleibt, wirkt auch ein frueher Werkzeugbestand absichtlich kuratiert statt unfertig.
              </MetaText>
            </Stack>
          </Card>
        </div>
      </Section>
    </Section>
  );
}
