import Link from "next/link";
import { cn } from "../../../lib/cn";
import { buttonVariants } from "../Button";
import Card from "../Card";
import MetaText from "../content/MetaText";
import SectionHeader from "../layout/SectionHeader";
import Stack from "../layout/Stack";

type ToolTeaserCardProps = {
  category: string;
  description: string;
  href: string;
  tags: readonly string[];
  title: string;
};

export default function ToolTeaserCard({
  category,
  description,
  href,
  tags,
  title,
}: ToolTeaserCardProps) {
  return (
    <Card as="article" tone="interactive" padding="md" className="h-full overflow-hidden">
      <SectionHeader
        eyebrow={category}
        title={title}
        titleAs="h3"
        titleSize="md"
        description={description}
        className="gap-3 sm:flex-col sm:justify-start"
      />

      <Stack gap="md" className="mt-auto">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-sm border border-border-subtle bg-muted-surface px-3 py-1 text-[0.72rem] uppercase tracking-[0.14em] text-fg-secondary"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <MetaText>Für schnelle Eingaben und klare Ergebnisse.</MetaText>
          <Link
            className={cn(
              buttonVariants({
                intent: "secondary",
                size: "sm",
              }),
              "w-fit shrink-0 no-underline"
            )}
            href={href}
          >
            Werkzeug öffnen
          </Link>
        </div>
      </Stack>
    </Card>
  );
}
