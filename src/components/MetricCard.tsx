import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import KpiValue from "./ui/content/KpiValue";
import MetaText from "./ui/content/MetaText";

type MetricCardProps = {
  children?: ReactNode;
  delta?: ReactNode;
  label: string;
  meta?: ReactNode;
  valueFootnote?: ReactNode;
  tone?: "default" | "elevated" | "muted" | "interactive";
  value: ReactNode;
  valueTone?: "default" | "positive" | "negative";
};

export default function MetricCard({
  children,
  delta,
  label,
  meta,
  tone = "muted",
  value,
  valueFootnote,
  valueTone = "default",
}: MetricCardProps) {
  const toneClassName =
    tone === "elevated"
      ? "bg-elevated"
      : tone === "interactive"
        ? "bg-elevated transition-colors duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:border-accent/40"
        : tone === "default"
          ? "bg-surface"
          : "bg-muted-surface";

  return (
    <div
      className={cn(
        "flex h-full min-h-[11.5rem] flex-col gap-3 border border-border-subtle px-3 py-3 sm:min-h-[12.25rem]",
        toneClassName
      )}
    >
      <KpiValue label={label} value={value} delta={delta} meta={meta} size="md" tone={valueTone} />
      <div className="mt-auto flex flex-col gap-2">
        {valueFootnote ? (
          <MetaText tone="strong" size="xs" className="leading-snug">
            {valueFootnote}
          </MetaText>
        ) : (
          <div aria-hidden="true" className="min-h-[1rem]" />
        )}
        {children}
      </div>
    </div>
  );
}
