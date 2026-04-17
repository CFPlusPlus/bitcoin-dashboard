import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";

const metaTextVariants = cva("type-body", {
  variants: {
    size: {
      xs: "",
      sm: "",
      base: "",
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
