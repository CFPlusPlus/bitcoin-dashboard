"use client";

import { RotateCw } from "lucide-react";
import { useI18n } from "../../../i18n/context";
import Button from "../Button";

type RetryButtonProps = {
  busy?: boolean;
  label?: string;
  onClick: () => void;
};

export default function RetryButton({ busy = false, label, onClick }: RetryButtonProps) {
  const { messages } = useI18n();
  const resolvedLabel = label ?? messages.common.retry;

  return (
    <Button intent="secondary" size="sm" onClick={onClick} disabled={busy}>
      <RotateCw className={busy ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
      {busy ? messages.common.loading : resolvedLabel}
    </Button>
  );
}
