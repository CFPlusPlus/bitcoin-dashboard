import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import KpiValue from "./ui/content/KpiValue";
import MetaText from "./ui/content/MetaText";
import DashboardPanel from "./ui/patterns/DashboardPanel";

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
  const panelTone =
    tone === "elevated" || tone === "interactive"
      ? "elevated"
      : tone === "default"
        ? "default"
        : "muted";

  return (
    <DashboardPanel
      padding="md"
      tone={panelTone}
      className={cn(
        "min-h-[11rem] min-w-0 sm:min-h-[11.5rem]",
        tone === "interactive" &&
          "transition-[border-color,background-color,color] duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:border-accent hover:bg-surface"
      )}
    >
      <KpiValue
        label={label}
        value={value}
        valueClassName={valueClassName}
        delta={delta}
        meta={meta}
        size="md"
        tone={valueTone}
      />

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
    </DashboardPanel>
  );
}
