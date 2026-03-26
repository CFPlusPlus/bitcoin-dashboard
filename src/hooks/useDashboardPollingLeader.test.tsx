import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDashboardPollingLeader } from "./useDashboardPollingLeader";

describe("useDashboardPollingLeader", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("elects only one active polling leader", async () => {
    const first = renderHook(() => useDashboardPollingLeader(true));
    const second = renderHook(() => useDashboardPollingLeader(true));

    await waitFor(() => {
      expect(Number(first.result.current) + Number(second.result.current)).toBe(1);
    });

    act(() => {
      first.unmount();
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => {
      expect(second.result.current).toBe(true);
    });
  });
});
