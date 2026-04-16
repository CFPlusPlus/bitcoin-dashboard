import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";
import Label from "./Label";
import MetaText from "./MetaText";

const kpiValueVariants = cva("font-numeric tabular-nums font-medium tracking-[-0.045em] text-fg", {
  variants: {
    size: {
      md: "text-[clamp(1.65rem,4.6vw,1.95rem)] leading-[0.93] sm:text-[clamp(1.8rem,2.8vw,2.05rem)]",
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
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      {label ? <Label>{label}</Label> : null}
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
