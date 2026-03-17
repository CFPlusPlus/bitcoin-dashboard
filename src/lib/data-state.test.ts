import { describe, expect, it } from "vitest";
import {
  DEFAULT_STALE_AFTER_MS,
  getLatestSuccessfulUpdate,
  isStaleByAge,
  resolveAsyncDataState,
} from "./data-state";

describe("resolveAsyncDataState", () => {
  const now = new Date("2026-03-17T12:00:00.000Z").getTime();

  it("returns loading when no usable data exists yet", () => {
    expect(
      resolveAsyncDataState({
        data: null,
        isLoading: true,
        now,
      }).status
    ).toBe("loading");
  });

  it("keeps content visible while a refresh is running", () => {
    const state = resolveAsyncDataState({
      data: { value: 1 },
      isLoading: true,
      lastUpdatedAt: "2026-03-17T11:59:00.000Z",
      now,
    });

    expect(state.status).toBe("success");
    expect(state.isRefreshing).toBe(true);
  });

  it("marks stale content after a failed refresh while preserving the data", () => {
    const state = resolveAsyncDataState({
      data: { value: 1 },
      error: "Provider offline.",
      isLoading: false,
      lastUpdatedAt: "2026-03-17T11:59:00.000Z",
      now,
    });

    expect(state.status).toBe("success");
    expect(state.isStale).toBe(true);
    expect(state.staleReason).toBe("refresh-error");
  });

  it("marks usable data as partial when requested", () => {
    expect(
      resolveAsyncDataState({
        data: { value: 1 },
        isLoading: false,
        isPartial: true,
        lastUpdatedAt: "2026-03-17T11:59:00.000Z",
        now,
      }).status
    ).toBe("partial");
  });

  it("detects empty responses separately from errors", () => {
    expect(
      resolveAsyncDataState({
        data: null,
        isEmpty: true,
        isLoading: false,
        now,
      }).status
    ).toBe("empty");
  });

  it("marks aged data as stale after the configured threshold", () => {
    expect(
      isStaleByAge(
        "2026-03-17T11:54:59.000Z",
        DEFAULT_STALE_AFTER_MS,
        new Date("2026-03-17T12:00:00.000Z").getTime()
      )
    ).toBe(true);
  });

  it("picks the most recent successful update across sections", () => {
    expect(
      getLatestSuccessfulUpdate([
        "2026-03-17T11:57:00.000Z",
        null,
        "2026-03-17T11:58:00.000Z",
        "2026-03-17T11:55:00.000Z",
      ])
    ).toBe("2026-03-17T11:58:00.000Z");
  });
});
