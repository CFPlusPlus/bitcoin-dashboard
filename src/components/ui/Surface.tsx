import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export const surfaceVariants = cva(
  "rounded-md border border-border-default/90 bg-surface text-fg shadow-surface",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4 sm:p-5",
        lg: "p-5 sm:p-6",
      },
      tone: {
        default: "bg-surface",
        elevated: "bg-elevated shadow-elevated",
        muted: "bg-muted-surface shadow-none",
        accent: "border-accent/30 bg-accent-soft",
        interactive:
          "bg-elevated shadow-surface transition-[border-color,background-color,color] duration-[var(--motion-base)] ease-[var(--ease-standard)] motion-safe:hover:border-accent/40 motion-safe:hover:bg-surface",
      },
    },
    defaultVariants: {
      padding: "md",
      tone: "default",
    },
  }
);

export type SurfaceProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof surfaceVariants> & {
    as?: "article" | "aside" | "div" | "header" | "section";
    children: ReactNode;
  };

export default function Surface({
  as = "div",
  children,
  className,
  padding,
  tone,
  ...props
}: SurfaceProps) {
  return createElement(
    as,
    {
      className: cn(surfaceVariants({ padding, tone }), className),
      ...props,
    },
    children
  );
}
