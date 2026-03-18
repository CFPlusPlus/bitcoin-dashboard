"use client";

import { RefreshCw } from "lucide-react";
import { useI18n } from "../../i18n/context";
import Button from "../../components/ui/Button";

type RefreshButtonProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

export default function RefreshButton({ refreshing, onRefresh }: RefreshButtonProps) {
  const { messages } = useI18n();

  return (
    <Button intent="primary" onClick={onRefresh} disabled={refreshing}>
      <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
      {refreshing ? messages.dashboard.controls.refreshingView : messages.dashboard.controls.refreshNow}
    </Button>
  );
}
