"use client";

import { useI18n } from "../../../i18n/context";
import StateBadge from "./StateBadge";

export default function StaleBadge() {
  const { messages } = useI18n();

  return <StateBadge tone="stale">{messages.common.stale}</StateBadge>;
}
