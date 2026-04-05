import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";
import Surface from "../Surface";

type StateTone = "empty" | "error" | "loading" | "partial" | "stale";

const toneStyles: Record<
  StateTone,
  {
    iconClassName: string;
    iconWrapClassName: string;
    messageClassName: string;
    surfaceClassName: string;
    titleClassName?: string;
  }
> = {
  empty: {
    iconClassName: "text-fg-muted",
    iconWrapClassName: "bg-muted-surface",
    messageClassName: "text-fg-secondary",
    surfaceClassName: "border-border-default bg-surface",
  },
  error: {
    iconClassName: "text-danger",
    iconWrapClassName: "bg-muted-surface",
    messageClassName: "text-fg-secondary",
    surfaceClassName: "border-danger bg-surface",
    titleClassName: "text-fg",
  },
  loading: {
    iconClassName: "animate-spin text-[var(--state-loading-fg)]",
    iconWrapClassName: "bg-muted-surface",
    messageClassName: "text-fg-secondary",
    surfaceClassName: "border-border-default bg-surface",
  },
  partial: {
    iconClassName: "text-[var(--state-partial-fg)]",
    iconWrapClassName: "bg-muted-surface",
    messageClassName: "text-fg-secondary",
    surfaceClassName: "border-info bg-surface",
  },
  stale: {
    iconClassName: "text-[var(--state-stale-fg)]",
    iconWrapClassName: "bg-muted-surface",
    messageClassName: "text-fg-secondary",
    surfaceClassName: "border-warning bg-surface",
  },
};

type StatePanelProps = {
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  description: ReactNode;
  icon: LucideIcon;
  title: ReactNode;
  tone: StateTone;
};

export default function StatePanel({
  action,
  className,
  compact = false,
  description,
  icon: Icon,
  title,
  tone,
}: StatePanelProps) {
  const { iconClassName, iconWrapClassName, messageClassName, surfaceClassName, titleClassName } =
    toneStyles[tone];

  return (
    <Surface
      padding={compact ? "sm" : "md"}
      className={cn(
        compact
          ? "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          : "flex flex-col gap-4",
        surfaceClassName,
        className
      )}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md border border-border-subtle",
            compact ? "mt-0.5 size-8" : "size-10",
            iconWrapClassName
          )}
        >
          <Icon className={cn(compact ? "size-4" : "size-5", iconClassName)} aria-hidden="true" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className={cn("font-medium text-fg", titleClassName)}>{title}</p>
          <p className={cn("text-sm leading-relaxed", messageClassName)}>{description}</p>
        </div>
      </div>

      {action ? (
        <div className={cn("flex flex-wrap items-center gap-2", compact && "sm:shrink-0")}>
          {action}
        </div>
      ) : null}
    </Surface>
  );
}
