import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";
import MetaText from "./MetaText";

const kpiValueVariants = cva("font-mono font-medium tracking-[-0.045em] text-fg", {
  variants: {
    size: {
      md: "text-[1.55rem] leading-tight sm:text-[2rem]",
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
  };

export default function KpiValue({
  className,
  delta,
  label,
  meta,
  size,
  tone,
  value,
  ...props
}: KpiValueProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {label ? (
        <MetaText className="uppercase tracking-[0.16em]" size="xs">
          {label}
        </MetaText>
      ) : null}
      <div className={cn(kpiValueVariants({ size, tone }))}>{value}</div>
      {delta ? <MetaText tone={tone === "default" ? "default" : tone}>{delta}</MetaText> : null}
      {meta ? <MetaText>{meta}</MetaText> : null}
    </div>
  );
}
