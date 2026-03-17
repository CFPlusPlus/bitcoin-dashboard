import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";

const surfaceVariants = cva(
  "rounded-xl border border-border-default bg-surface text-fg shadow-surface backdrop-blur-sm",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4",
        md: "p-5 sm:p-6",
        lg: "p-6 sm:p-7",
      },
      tone: {
        default: "bg-surface",
        elevated: "bg-elevated shadow-elevated",
        muted: "bg-muted-surface shadow-none",
        accent: "border-accent/25 bg-accent-soft",
      },
    },
    defaultVariants: {
      padding: "md",
      tone: "default",
    },
  }
);

type SurfaceProps = HTMLAttributes<HTMLElement> &
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
