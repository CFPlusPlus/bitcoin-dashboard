"use client";

import Link from "next/link";
import { buttonVariants } from "../components/ui/Button";
import Card from "../components/ui/Card";
import MetaText from "../components/ui/content/MetaText";
import Section from "../components/ui/layout/Section";
import SectionHeader from "../components/ui/layout/SectionHeader";
import Stack from "../components/ui/layout/Stack";
import ToolTeaserCard from "../components/ui/patterns/ToolTeaserCard";
import { getToolCards } from "../data/tools";
import { getLocalizedPathname } from "../i18n/config";
import { useI18n } from "../i18n/context";
import { cn } from "../lib/cn";

export default function ToolsPage() {
  const { locale, messages } = useI18n();
  const toolCards = getToolCards(locale);
  const featuredTool = toolCards[0];
  const copy = messages.tools.page;

  return (
    <Section space="lg">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={
          <Link
            href={getLocalizedPathname(locale, featuredTool.href)}
            className={cn(
              buttonVariants({
                intent: "primary",
                size: "sm",
              }),
              "no-underline"
            )}
          >
            {copy.openFeatured}
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
        <Card as="article" tone="muted" padding="lg">
          <SectionHeader
            eyebrow={copy.focusEyebrow}
            title={copy.focusTitle}
            titleAs="h2"
            titleSize="md"
            description={copy.focusDescription}
            className="gap-3 sm:flex-col sm:justify-start"
          />

          <div className="grid gap-3 md:grid-cols-3">
            {copy.pillars.map((pillar) => (
              <Card key={pillar.title} as="section" tone="default" padding="md" gap="sm">
                <MetaText tone="strong">{pillar.title}</MetaText>
                <MetaText>{pillar.description}</MetaText>
              </Card>
            ))}
          </div>
        </Card>

        <Card as="article" tone="accent" padding="lg">
          <SectionHeader
            eyebrow={copy.highlightEyebrow}
            title={copy.highlightTitle}
            titleAs="h2"
            titleSize="md"
            description={copy.highlightDescription}
            className="gap-3 sm:flex-col sm:justify-start"
          />

          <Stack gap="sm">
            <MetaText tone="strong">{copy.highlightLead}</MetaText>
            <MetaText>{copy.highlightBody}</MetaText>
          </Stack>
        </Card>
      </div>

      <Section space="md" aria-label={copy.listAriaLabel}>
        <SectionHeader
          eyebrow={copy.listEyebrow}
          title={copy.listTitle}
          description={copy.listDescription}
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
              eyebrow={copy.nextEyebrow}
              title={copy.nextTitle}
              titleAs="h3"
              titleSize="md"
              description={copy.nextDescription}
              className="gap-3 sm:flex-col sm:justify-start"
            />

            <Stack gap="sm" className="mt-auto">
              <MetaText tone="strong">{copy.nextLead}</MetaText>
              <MetaText>{copy.nextBody}</MetaText>
            </Stack>
          </Card>
        </div>
      </Section>
    </Section>
  );
}
