import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";

const stateBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.72rem] font-medium leading-none tracking-[0.08em]",
  {
    variants: {
      tone: {
        default: "border-border-default bg-elevated text-fg-secondary",
        loading: "border-accent bg-muted-surface text-accent",
        partial: "border-info bg-muted-surface text-info",
        stale: "border-warning bg-muted-surface text-warning",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
);

type StateBadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof stateBadgeVariants> & {
    children: ReactNode;
    spinning?: boolean;
  };

export default function StateBadge({
  children,
  className,
  spinning = false,
  tone,
  ...props
}: StateBadgeProps) {
  return (
    <span className={cn(stateBadgeVariants({ tone }), className)} {...props}>
      {spinning ? <LoaderCircle className="size-3 animate-spin" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
