import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";

const labelVariants = cva("type-overline", {
  variants: {
    size: {
      sm: "opacity-90",
      md: "",
    },
    tone: {
      accent: "text-accent",
      default: "text-fg-secondary",
      muted: "text-fg-muted",
      strong: "text-fg",
      positive: "text-success",
      negative: "text-danger",
    },
    treatment: {
      default: "",
      marker: "font-mono tracking-[0.18em]",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
    treatment: "default",
  },
});

type LabelProps = HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof labelVariants> & {
    children: ReactNode;
  };

export default function Label({
  children,
  className,
  size,
  tone,
  treatment,
  ...props
}: LabelProps) {
  return (
    <p className={cn(labelVariants({ size, tone, treatment }), className)} {...props}>
      {children}
    </p>
  );
}
