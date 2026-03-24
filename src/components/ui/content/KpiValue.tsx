import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";
import MetaText from "./MetaText";

const kpiValueVariants = cva("font-numeric tabular-nums font-medium tracking-[-0.045em] text-fg", {
  variants: {
    size: {
      md: "text-[clamp(1.75rem,5vw,2rem)] leading-[0.95] sm:text-[clamp(1.9rem,3vw,2.15rem)]",
      lg: "text-[2.2rem] leading-none sm:text-[3.35rem]",
    },
    tone: {
      default: "text-fg",
      positive: "text-success",
      negative: "text-danger",
    },
  },
  defaultVariants: {
    size: "lg",
    tone: "default",
  },
});

type KpiValueProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof kpiValueVariants> & {
    delta?: ReactNode;
    label?: ReactNode;
    meta?: ReactNode;
    value: ReactNode;
    valueClassName?: string;
  };

export default function KpiValue({
  className,
  delta,
  label,
  meta,
  size,
  tone,
  value,
  valueClassName,
  ...props
}: KpiValueProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {label ? (
        <MetaText className="uppercase tracking-[0.16em]" size="xs">
          {label}
        </MetaText>
      ) : null}
      <div
        className={cn(
          "min-w-0 whitespace-normal [overflow-wrap:anywhere]",
          kpiValueVariants({ size, tone }),
          valueClassName
        )}
      >
        {value}
      </div>
      {delta ? <MetaText tone={tone === "default" ? "default" : tone}>{delta}</MetaText> : null}
      {meta ? <MetaText>{meta}</MetaText> : null}
    </div>
  );
}
