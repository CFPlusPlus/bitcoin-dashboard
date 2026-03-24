import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LEADER_STORAGE_KEY = "bitcoin-dashboard:polling-leader";
const LEADER_HEARTBEAT_INTERVAL_MS = 10_000;
const LEADER_STALE_AFTER_MS = 25_000;

type LeaderRecord = {
  id: string;
  lastSeenAt: number;
};

function createTabId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseLeaderRecord(rawValue: string | null) {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<LeaderRecord>;

    if (
      typeof parsedValue.id !== "string" ||
      typeof parsedValue.lastSeenAt !== "number" ||
      Number.isNaN(parsedValue.lastSeenAt)
    ) {
      return null;
    }

    return parsedValue as LeaderRecord;
  } catch {
    return null;
  }
}

function isLeaderFresh(record: LeaderRecord | null, now = Date.now()) {
  if (!record) {
    return false;
  }

  return now - record.lastSeenAt < LEADER_STALE_AFTER_MS;
}

export function useDashboardPollingLeader(enabled: boolean) {
  const tabId = useMemo(() => createTabId(), []);
  const [isLeader, setIsLeader] = useState(false);
  const isLeaderRef = useRef(false);

  const releaseLeadership = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentLeader = parseLeaderRecord(window.localStorage.getItem(LEADER_STORAGE_KEY));

    if (currentLeader?.id === tabId) {
      window.localStorage.removeItem(LEADER_STORAGE_KEY);
    }

    isLeaderRef.current = false;
    setIsLeader(false);
  }, [tabId]);

  const evaluateLeadership = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return false;
    }

    if (!enabled || document.hidden) {
      releaseLeadership();
      return false;
    }

    const now = Date.now();
    const currentLeader = parseLeaderRecord(window.localStorage.getItem(LEADER_STORAGE_KEY));

    if (!isLeaderFresh(currentLeader, now) || currentLeader?.id === tabId) {
      window.localStorage.setItem(
        LEADER_STORAGE_KEY,
        JSON.stringify({
          id: tabId,
          lastSeenAt: now,
        } satisfies LeaderRecord)
      );

      isLeaderRef.current = true;
      setIsLeader(true);
      return true;
    }

    isLeaderRef.current = false;
    setIsLeader(false);
    return false;
  }, [enabled, releaseLeadership, tabId]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return () => undefined;
    }

    const handleVisibilityChange = () => {
      void evaluateLeadership();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== LEADER_STORAGE_KEY) {
        return;
      }

      void evaluateLeadership();
    };

    const handlePageHide = () => {
      releaseLeadership();
    };

    const initialSyncId = window.setTimeout(() => {
      void evaluateLeadership();
    }, 0);

    const heartbeatId = window.setInterval(() => {
      void evaluateLeadership();
    }, LEADER_HEARTBEAT_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearTimeout(initialSyncId);
      window.clearInterval(heartbeatId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pagehide", handlePageHide);

      if (isLeaderRef.current) {
        releaseLeadership();
      }
    };
  }, [evaluateLeadership, releaseLeadership]);

  return isLeader;
}
