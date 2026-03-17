import type { ReactNode } from "react";
import Card from "./ui/Card";
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
  return (
    <Card as="article" tone={tone} padding="sm" gap="sm" className="h-full">
      <KpiValue label={label} value={value} size="md" tone={valueTone} />
      {children}
    </Card>
  );
}
