"use client";

import { Clock3 } from "lucide-react";
import { useI18n } from "../../../i18n/context";
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
  emptyLabel,
  label,
  value,
}: LastUpdatedProps) {
  const { locale, messages } = useI18n();
  const exactTime = formatDateTime(value, locale);
  const relativeTime = formatRelativeTime(value, locale);
  const resolvedEmptyLabel = emptyLabel ?? messages.common.noSuccessfulFetch;
  const resolvedLabel = label ?? messages.common.status;

  return (
    <p
      className={cn("inline-flex items-center gap-1.5 text-xs text-fg-muted", className)}
      title={value ? exactTime : undefined}
    >
      <Clock3 className="size-3.5 text-fg-muted" aria-hidden="true" />
      {value ? `${resolvedLabel} ${relativeTime}` : resolvedEmptyLabel}
    </p>
  );
}
