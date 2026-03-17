import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type HTMLAttributes } from "react";
import { cn } from "../../../lib/cn";

const pageContainerVariants = cva("mx-auto w-full", {
  variants: {
    gutter: {
      none: "",
      default: "px-[var(--container-padding-x)]",
    },
    width: {
      default: "max-w-[var(--container-max-width)]",
      wide: "max-w-[80rem]",
      narrow: "max-w-4xl",
    },
  },
  defaultVariants: {
    gutter: "default",
    width: "default",
  },
});

type PageContainerProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof pageContainerVariants> & {
    as?: "div" | "main" | "section";
  };

export default function PageContainer({
  as = "div",
  className,
  gutter,
  width,
  ...props
}: PageContainerProps) {
  return createElement(as, {
    className: cn(pageContainerVariants({ gutter, width }), className),
    ...props,
  });
}
