import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../../lib/cn";

const sectionTitleVariants = cva("font-sans text-fg tracking-[-0.04em]", {
  variants: {
    size: {
      md: "text-[1.55rem] leading-[1] sm:text-[1.95rem]",
      lg: "text-[2rem] leading-[0.96] sm:text-[2.85rem]",
      xl: "text-[2.85rem] leading-[0.9] sm:text-[4.15rem]",
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
