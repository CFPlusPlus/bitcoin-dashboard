import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import KpiValue from "./ui/content/KpiValue";

type MetricCardProps = {
  children?: ReactNode;
  label: string;
  tone?: "default" | "elevated" | "muted" | "interactive";
  value: ReactNode;
  valueTone?: "default" | "positive" | "negative";
};

export default function MetricCard({
  children,
  label,
  tone = "muted",
  value,
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
        "flex h-full flex-col gap-2 border border-border-subtle px-3 py-3",
        toneClassName
      )}
    >
      <KpiValue label={label} value={value} size="md" tone={valueTone} />
      {children}
    </div>
  );
}
