"use client";

import { useI18n } from "../../i18n/context";
import Button from "../../components/ui/Button";

type AutoRefreshToggleProps = {
  autoRefresh: boolean;
  onChange: (value: boolean) => void;
};

export default function AutoRefreshToggle({ autoRefresh, onChange }: AutoRefreshToggleProps) {
  const { messages } = useI18n();

  return (
    <Button
      active={autoRefresh}
      intent="secondary"
      size="md"
      onClick={() => onChange(!autoRefresh)}
    >
      {autoRefresh
        ? messages.dashboard.controls.autoRefreshOn
        : messages.dashboard.controls.autoRefreshOff}
    </Button>
  );
}
