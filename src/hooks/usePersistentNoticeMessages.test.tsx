import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DashboardNoticeCandidate } from "../lib/dashboard-notices";
import { usePersistentNoticeMessages } from "./usePersistentNoticeMessages";

describe("usePersistentNoticeMessages", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows notice messages only after the configured delay", () => {
    vi.useFakeTimers();

    const candidates: DashboardNoticeCandidate[] = [
      {
        key: "network-critical-loss",
        message: "Persistente Netzwerk-Einschränkung",
      },
    ];

    const { result } = renderHook(() => usePersistentNoticeMessages(candidates, 2 * 60_000));

    expect(result.current).toEqual([]);

    act(() => {
      vi.advanceTimersByTime(119_000);
    });

    expect(result.current).toEqual([]);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current).toEqual(["Persistente Netzwerk-Einschränkung"]);
  });

  it("resets the delay when a candidate disappears and returns later", () => {
    vi.useFakeTimers();

    const candidates: DashboardNoticeCandidate[] = [
      {
        key: "network-critical-loss",
        message: "Persistente Netzwerk-Einschränkung",
      },
    ];

    const { result, rerender } = renderHook(
      ({ nextCandidates }) => usePersistentNoticeMessages(nextCandidates, 2 * 60_000),
      {
        initialProps: {
          nextCandidates: candidates,
        },
      }
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current).toEqual([]);

    rerender({ nextCandidates: [] });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current).toEqual([]);

    rerender({ nextCandidates: candidates });

    act(() => {
      vi.advanceTimersByTime(119_000);
    });

    expect(result.current).toEqual([]);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current).toEqual(["Persistente Netzwerk-Einschränkung"]);
  });
});
