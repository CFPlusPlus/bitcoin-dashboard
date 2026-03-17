import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";
import { cn } from "../lib/cn";
import Button from "./ui/Button";
import Surface from "./ui/Surface";

type AsyncStateProps = {
  actionLabel?: string;
  className?: string;
  compact?: boolean;
  message: string;
  onAction?: () => void;
  title: string;
  variant: "loading" | "error" | "empty";
};

const variantStyles = {
  empty: {
    icon: Inbox,
    iconClassName: "text-info",
    messageClassName: "text-fg-muted",
    surfaceClassName: "border-dashed border-border-subtle bg-[var(--state-empty-bg)]",
  },
  error: {
    icon: AlertTriangle,
    iconClassName: "text-warning",
    messageClassName: "text-[var(--state-error-fg)]",
    surfaceClassName: "border-warning/30 bg-[var(--state-error-bg)]",
  },
  loading: {
    icon: LoaderCircle,
    iconClassName: "animate-spin text-[var(--state-loading-fg)]",
    messageClassName: "text-fg-muted",
    surfaceClassName: "border-dashed border-border-default bg-[var(--state-loading-bg)]",
  },
} as const;

export default function AsyncState({
  actionLabel,
  className,
  compact = false,
  message,
  onAction,
  title,
  variant,
}: AsyncStateProps) {
  const { icon: Icon, iconClassName, messageClassName, surfaceClassName } = variantStyles[variant];

  return (
    <Surface
      padding={compact ? "sm" : "md"}
      className={cn(
        "flex flex-col gap-3",
        compact ? "mb-4" : "",
        surfaceClassName,
        className
      )}
      aria-live={variant === "loading" ? "polite" : "assertive"}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-elevated">
          <Icon className={cn("size-4", iconClassName)} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-fg">{title}</p>
          <p className={cn("text-sm", messageClassName)}>{message}</p>
        </div>
      </div>
      {actionLabel && onAction ? (
        <Button intent="secondary" size="sm" className="w-fit" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Surface>
  );
}
