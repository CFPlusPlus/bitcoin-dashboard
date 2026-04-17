import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../../lib/cn";

type DisplayTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3";
  children: ReactNode;
};

export default function DisplayTitle({
  as = "h1",
  children,
  className,
  ...props
}: DisplayTitleProps) {
  return createElement(
    as,
    {
      className: cn("type-display text-fg font-light", className),
      ...props,
    },
    children
  );
}
