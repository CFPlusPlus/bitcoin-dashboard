import { Clock3 } from "lucide-react";
import { formatDateTime, formatRelativeTime } from "../../../lib/format";
import { cn } from "../../../lib/cn";

type LastUpdatedProps = {
  className?: string;
  emptyLabel?: string;
  label?: string;
  value: string | null;
};

export default function LastUpdated({
  className,
  emptyLabel = "Noch kein erfolgreicher Abruf",
  label = "Stand",
  value,
}: LastUpdatedProps) {
  const exactTime = formatDateTime(value);
  const relativeTime = formatRelativeTime(value);

  return (
    <p
      className={cn("inline-flex items-center gap-1.5 text-xs text-fg-muted", className)}
      title={value ? exactTime : undefined}
    >
      <Clock3 className="size-3.5 text-fg-muted" aria-hidden="true" />
      {value ? `${label} ${relativeTime}` : emptyLabel}
    </p>
  );
}
