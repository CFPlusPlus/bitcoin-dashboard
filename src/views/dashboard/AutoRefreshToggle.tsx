"use client";

import { useI18n } from "../../i18n/context";
import Button from "../../components/ui/Button";
import { cn } from "../../lib/cn";

type AutoRefreshToggleProps = {
  autoRefresh: boolean;
  className?: string;
  onChange: (value: boolean) => void;
  size?: "sm" | "md";
};

export default function AutoRefreshToggle({
  autoRefresh,
  className,
  onChange,
  size = "md",
}: AutoRefreshToggleProps) {
  const { messages } = useI18n();

  return (
    <Button
      active={autoRefresh}
      intent="secondary"
      size={size}
      className={cn(className)}
      onClick={() => onChange(!autoRefresh)}
    >
      {autoRefresh
        ? messages.dashboard.controls.autoRefreshOn
        : messages.dashboard.controls.autoRefreshOff}
    </Button>
  );
}
