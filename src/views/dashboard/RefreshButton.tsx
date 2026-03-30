"use client";

import { RefreshCw } from "lucide-react";
import { useI18n } from "../../i18n/context";
import Button from "../../components/ui/Button";
import { cn } from "../../lib/cn";

type RefreshButtonProps = {
  className?: string;
  refreshing: boolean;
  onRefresh: () => void;
  size?: "sm" | "md";
};

export default function RefreshButton({
  className,
  refreshing,
  onRefresh,
  size = "md",
}: RefreshButtonProps) {
  const { messages } = useI18n();

  return (
    <Button
      intent="primary"
      size={size}
      className={cn(className)}
      onClick={onRefresh}
      disabled={refreshing}
    >
      <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
      {refreshing
        ? messages.dashboard.controls.refreshingView
        : messages.dashboard.controls.refreshNow}
    </Button>
  );
}
