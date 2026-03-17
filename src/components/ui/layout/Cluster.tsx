import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";

const clusterVariants = cva("flex flex-wrap", {
  variants: {
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
    },
    gap: {
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    },
    justify: {
      start: "justify-start",
      between: "justify-between",
      end: "justify-end",
    },
  },
  defaultVariants: {
    align: "center",
    gap: "md",
    justify: "start",
  },
});

type ClusterProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof clusterVariants> & {
    children: ReactNode;
  };

export default function Cluster({
  align,
  children,
  className,
  gap,
  justify,
  ...props
}: ClusterProps) {
  return (
    <div className={cn(clusterVariants({ align, gap, justify }), className)} {...props}>
      {children}
    </div>
  );
}
