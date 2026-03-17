type AsyncStateProps = {
  actionLabel?: string;
  className?: string;
  compact?: boolean;
  message: string;
  onAction?: () => void;
  title: string;
  variant: "loading" | "error" | "empty";
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function AsyncState({
  actionLabel,
  className,
  compact = false,
  message,
  onAction,
  title,
  variant,
}: AsyncStateProps) {
  return (
    <div
      className={joinClassNames(
        "async-state",
        `async-state-${variant}`,
        compact && "async-state-compact",
        className
      )}
      aria-live={variant === "loading" ? "polite" : "assertive"}
    >
      {variant === "loading" ? <span className="async-state-spinner" aria-hidden="true" /> : null}
      <div className="async-state-copy">
        <p className="async-state-title">{title}</p>
        <p className="async-state-message">{message}</p>
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="range-btn async-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
