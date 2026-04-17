import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../../lib/cn";

const sectionTitleVariants = cva("type-section text-fg", {
  variants: {
    size: {
      md: "",
      lg: "",
      xl: "",
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
