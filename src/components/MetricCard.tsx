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
  valueClassName?: string;
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
  valueClassName,
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
  const accentClassName =
    valueTone === "positive"
      ? "bg-success"
      : valueTone === "negative"
        ? "bg-danger"
        : tone === "interactive" || tone === "elevated"
          ? "bg-accent/65"
          : "bg-border-default";

  return (
    <div
      className={cn(
        "flex h-full min-h-[11rem] min-w-0 flex-col gap-4 overflow-hidden rounded-md border border-border-default px-4 py-4 sm:min-h-[11.5rem]",
        toneClassName
      )}
    >
      <span aria-hidden="true" className={cn("h-px w-9", accentClassName)} />

      <KpiValue
        label={label}
        value={value}
        valueClassName={valueClassName}
        delta={delta}
        meta={meta}
        size="md"
        tone={valueTone}
      />

      <div className="mt-auto flex flex-col gap-2 border-t border-border-default/75 pt-3">
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
