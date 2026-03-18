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
    <Section as="section" aria-label="Werkzeugvorschau" space="md">
      <SectionHeader
        eyebrow="Werkzeuge"
        title="Werkzeuge für den nächsten Schritt"
        description="Wenn der Blick sitzt, helfen die Werkzeuge beim Rechnen und Einordnen."
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
            Werkzeugseite
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(18rem,1.15fr)]">
        <Card as="article" tone="muted" padding="md" className="justify-between">
          <SectionHeader
            eyebrow="Weiterführend"
            title="Vom Blick zur Aktion"
            titleAs="h3"
            titleSize="md"
            description="Hier wird aus Beobachtung eine konkrete Bitcoin-Entscheidung."
            className="gap-3 sm:flex-col sm:justify-start"
          />

          <Stack gap="md">
            <MetaText tone="strong">
              Starte mit dem DCA-Rechner, wenn du Käufe sauber einordnen willst.
            </MetaText>
            <div className="border-t border-border-subtle pt-4">
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
                  DCA-Rechner
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
                  Alle Werkzeuge
                </Link>
              </div>
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
