import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";

const metaTextVariants = cva("leading-relaxed", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
    },
    tone: {
      default: "text-fg-muted",
      strong: "text-fg-secondary",
      accent: "text-accent-strong",
      positive: "text-success",
      negative: "text-danger",
    },
  },
  defaultVariants: {
    size: "sm",
    tone: "default",
  },
});

type MetaTextProps = HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof metaTextVariants> & {
    children: ReactNode;
  };

export default function MetaText({ children, className, size, tone, ...props }: MetaTextProps) {
  return (
    <p className={cn(metaTextVariants({ size, tone }), className)} {...props}>
      {children}
    </p>
  );
}
