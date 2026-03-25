"use client";

import Link from "next/link";
import { buttonVariants } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import MetaText from "../../components/ui/content/MetaText";
import Section from "../../components/ui/layout/Section";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";
import ToolTeaserCard from "../../components/ui/patterns/ToolTeaserCard";
import { getToolCards } from "../../data/tools";
import { getLocalizedPathname } from "../../i18n/config";
import { useI18n } from "../../i18n/context";
import { cn } from "../../lib/cn";

export default function ToolsPreviewSection() {
  const { locale, messages } = useI18n();
  const copy = messages.tools.preview;
  const toolCards = getToolCards(locale);
  const featuredTool = toolCards[0];

  return (
    <Section as="section" aria-label={copy.ariaLabel} space="md">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={
          <Link
            href={getLocalizedPathname(locale, "/tools")}
            className={cn(
              buttonVariants({
                intent: "secondary",
                size: "sm",
              }),
              "no-underline"
            )}
          >
            {copy.pageLink}
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.74fr)_minmax(20rem,1.26fr)]">
        <Card as="article" tone="accent" padding="lg" className="justify-between">
          <SectionHeader
            eyebrow={copy.followUpEyebrow}
            title={copy.followUpTitle}
            titleAs="h3"
            titleSize="md"
            description={copy.followUpDescription}
            className="gap-3 sm:flex-col sm:justify-start"
          />

          <Stack gap="md">
            <MetaText tone="strong" className="max-w-[34ch] text-base leading-7 text-fg">
              {copy.followUpLead}
            </MetaText>
            <MetaText className="max-w-[40ch]">{copy.followUpBody}</MetaText>
            <div className="flex flex-wrap gap-3 border-t border-border-default/70 pt-4">
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
                {copy.openDca}
              </Link>
              <Link
                href={getLocalizedPathname(locale, "/tools")}
                className={cn(
                  buttonVariants({
                    intent: "ghost",
                    size: "sm",
                  }),
                  "no-underline"
                )}
              >
                {copy.allTools}
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
