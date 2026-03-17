import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";
import Eyebrow from "../content/Eyebrow";
import MetaText from "../content/MetaText";
import SectionTitle from "../content/SectionTitle";
import Cluster from "./Cluster";
import Stack from "./Stack";

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
  action?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  title: ReactNode;
  titleAs?: "h1" | "h2" | "h3";
  titleSize?: "md" | "lg" | "xl";
};

export default function SectionHeader({
  action,
  className,
  description,
  eyebrow,
  meta,
  title,
  titleAs = "h2",
  titleSize = "md",
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
      {...props}
    >
      <Stack gap="sm" className="min-w-0">
        {typeof eyebrow === "string" ? <Eyebrow>{eyebrow}</Eyebrow> : eyebrow}
        <Stack gap="xs">
          <SectionTitle as={titleAs} size={titleSize}>
            {title}
          </SectionTitle>
          {description ? <MetaText size="base">{description}</MetaText> : null}
        </Stack>
      </Stack>

      {meta || action ? (
        <Cluster
          align="center"
          gap="sm"
          justify="end"
          className="sm:shrink-0 sm:justify-end"
        >
          {meta}
          {action}
        </Cluster>
      ) : null}
    </div>
  );
}
