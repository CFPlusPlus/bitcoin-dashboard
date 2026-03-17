import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../../lib/cn";

const sectionTitleVariants = cva("font-serif text-fg", {
  variants: {
    size: {
      md: "text-2xl leading-tight sm:text-3xl",
      lg: "text-3xl leading-tight sm:text-4xl",
      xl: "text-4xl leading-none sm:text-5xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

type SectionTitleProps = HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof sectionTitleVariants> & {
    as?: "h1" | "h2" | "h3";
    children: ReactNode;
  };

export default function SectionTitle({
  as = "h2",
  children,
  className,
  size,
  ...props
}: SectionTitleProps) {
  return createElement(
    as,
    {
      className: cn(sectionTitleVariants({ size }), className),
      ...props,
    },
    children
  );
}
