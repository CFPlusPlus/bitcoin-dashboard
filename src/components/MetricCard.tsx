import type { ReactNode } from "react";

type MetricCardProps = {
  children?: ReactNode;
  label: string;
  value: ReactNode;
  valueTone?: "default" | "positive" | "negative";
};

export default function MetricCard({
  children,
  label,
  value,
  valueTone = "default",
}: MetricCardProps) {
  const className =
    valueTone === "default" ? "metric-value" : `metric-value metric-value-${valueTone}`;

  return (
    <article className="card">
      <p className="label">{label}</p>
      <h2 className={className}>{value}</h2>
      {children}
    </article>
  );
}
