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
  }
> = {
  empty: {
    iconClassName: "text-info",
    iconWrapClassName: "bg-elevated",
    messageClassName: "text-fg-muted",
    surfaceClassName: "border-dashed border-border-subtle bg-[var(--state-empty-bg)]",
  },
  error: {
    iconClassName: "text-danger",
    iconWrapClassName: "bg-danger/12",
    messageClassName: "text-[var(--state-error-fg)]",
    surfaceClassName: "border-danger/25 bg-[var(--state-error-bg)]",
  },
  loading: {
    iconClassName: "animate-spin text-[var(--state-loading-fg)]",
    iconWrapClassName: "bg-accent-soft",
    messageClassName: "text-fg-muted",
    surfaceClassName: "border-dashed border-border-default bg-[var(--state-loading-bg)]",
  },
  partial: {
    iconClassName: "text-[var(--state-partial-fg)]",
    iconWrapClassName: "bg-info/10",
    messageClassName: "text-fg-secondary",
    surfaceClassName: "border-info/25 bg-[var(--state-partial-bg)]",
  },
  stale: {
    iconClassName: "text-[var(--state-stale-fg)]",
    iconWrapClassName: "bg-warning/10",
    messageClassName: "text-fg-secondary",
    surfaceClassName: "border-warning/25 bg-[var(--state-stale-bg)]",
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
  const { iconClassName, iconWrapClassName, messageClassName, surfaceClassName } =
    toneStyles[tone];

  return (
    <Surface
      padding={compact ? "sm" : "md"}
      className={cn(
        compact ? "flex flex-col gap-3" : "flex flex-col gap-4",
        surfaceClassName,
        className
      )}
      aria-live={tone === "loading" ? "polite" : "assertive"}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md",
            compact ? "mt-0.5 size-8" : "size-10",
            iconWrapClassName
          )}
        >
          <Icon className={cn(compact ? "size-4" : "size-5", iconClassName)} aria-hidden="true" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="font-semibold text-fg">{title}</p>
          <p className={cn("text-sm leading-relaxed", messageClassName)}>{description}</p>
        </div>
      </div>

      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </Surface>
  );
}
