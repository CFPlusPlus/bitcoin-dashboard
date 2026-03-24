"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardNoticeCandidate } from "../lib/dashboard-notices";

function areMessageListsEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((message, index) => message === right[index]);
}

export function usePersistentNoticeMessages(
  candidates: DashboardNoticeCandidate[],
  delayMs: number
) {
  const firstSeenRef = useRef<Record<string, number>>({});
  const [tick, setTick] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);

  useEffect(() => {
    const firstSeen = firstSeenRef.current;
    const now = Date.now();
    const activeKeys = new Set(candidates.map((candidate) => candidate.key));

    for (const candidate of candidates) {
      if (firstSeen[candidate.key] === undefined) {
        firstSeen[candidate.key] = now;
      }
    }

    for (const key of Object.keys(firstSeen)) {
      if (!activeKeys.has(key)) {
        delete firstSeen[key];
      }
    }

    const pendingDurations = candidates
      .map((candidate) => delayMs - (now - (firstSeen[candidate.key] ?? now)))
      .filter((duration) => duration > 0);
    const nextVisibleMessages = candidates
      .filter((candidate) => now - (firstSeen[candidate.key] ?? now) >= delayMs)
      .map((candidate) => candidate.message);

    setVisibleMessages((currentMessages) =>
      areMessageListsEqual(currentMessages, nextVisibleMessages)
        ? currentMessages
        : nextVisibleMessages
    );

    if (pendingDurations.length === 0) {
      return;
    }

    const timerId = window.setTimeout(
      () => {
        setTick((value) => value + 1);
      },
      Math.min(...pendingDurations)
    );

    return () => window.clearTimeout(timerId);
  }, [candidates, delayMs, tick]);

  return visibleMessages;
}
