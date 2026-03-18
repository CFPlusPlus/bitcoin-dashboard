import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../../lib/cn";

const sectionTitleVariants = cva("font-serif text-fg tracking-[-0.035em]", {
  variants: {
    size: {
      md: "text-[1.65rem] leading-[1.03] sm:text-[2.1rem]",
      lg: "text-[2.1rem] leading-[0.98] sm:text-[3rem]",
      xl: "text-[2.9rem] leading-[0.9] sm:text-[4.25rem]",
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
