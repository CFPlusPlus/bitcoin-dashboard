import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../../lib/cn";

const sectionVariants = cva("flex flex-col", {
  variants: {
    space: {
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
    },
  },
  defaultVariants: {
    space: "md",
  },
});

type SectionProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof sectionVariants> & {
    as?: "article" | "div" | "section";
    children: ReactNode;
  };

export default function Section({
  as = "section",
  children,
  className,
  space,
  ...props
}: SectionProps) {
  return createElement(
    as,
    {
      className: cn(sectionVariants({ space }), className),
      ...props,
    },
    children
  );
}
