export const DEFAULT_STALE_AFTER_MS = 5 * 60_000;

export type AsyncDataStatus = "loading" | "success" | "empty" | "partial" | "error";
export type AsyncStaleReason = "age" | "refresh-error" | null;

export type AsyncDataState<T> = {
  data: T | null;
  error: string | null;
  hasUsableData: boolean;
  isEmpty: boolean;
  isLoading: boolean;
  isPartial: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  lastUpdatedAt: string | null;
  staleReason: AsyncStaleReason;
  status: AsyncDataStatus;
};

type ResolveAsyncDataStateOptions<T> = {
  data: T | null;
  error?: string | null;
  hasUsableData?: boolean;
  isEmpty?: boolean;
  isLoading: boolean;
  isPartial?: boolean;
  isRefreshing?: boolean;
  lastUpdatedAt?: string | null;
  now?: number;
  staleAfterMs?: number | null;
};

function normalizeErrorMessage(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getTimestamp(value: string | null | undefined) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function isStaleByAge(
  lastUpdatedAt: string | null | undefined,
  staleAfterMs: number | null = DEFAULT_STALE_AFTER_MS,
  now = Date.now()
) {
  if (staleAfterMs === null) return false;

  const timestamp = getTimestamp(lastUpdatedAt);
  if (timestamp === null) return false;

  return now - timestamp >= staleAfterMs;
}

export function resolveAsyncDataState<T>({
  data,
  error,
  hasUsableData = data !== null,
  isEmpty = false,
  isLoading,
  isPartial = false,
  isRefreshing,
  lastUpdatedAt = null,
  now = Date.now(),
  staleAfterMs = DEFAULT_STALE_AFTER_MS,
}: ResolveAsyncDataStateOptions<T>): AsyncDataState<T> {
  const normalizedError = normalizeErrorMessage(error);
  const refreshing = isRefreshing ?? (isLoading && hasUsableData);
  const staleByError = Boolean(hasUsableData && normalizedError);
  const staleByAge = Boolean(hasUsableData && isStaleByAge(lastUpdatedAt, staleAfterMs, now));
  const staleReason = staleByError ? "refresh-error" : staleByAge ? "age" : null;
  const stale = staleReason !== null;

  let status: AsyncDataStatus = "success";

  if (!hasUsableData && isLoading) {
    status = "loading";
  } else if (!hasUsableData && normalizedError) {
    status = "error";
  } else if (!hasUsableData && isEmpty) {
    status = "empty";
  } else if (hasUsableData && isPartial) {
    status = "partial";
  }

  return {
    data,
    error: normalizedError,
    hasUsableData,
    isEmpty,
    isLoading,
    isPartial,
    isRefreshing: refreshing,
    isStale: stale,
    lastUpdatedAt,
    staleReason,
    status,
  };
}

export function getLatestSuccessfulUpdate(values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => ({
      raw: value ?? null,
      timestamp: getTimestamp(value),
    }))
    .filter((item): item is { raw: string; timestamp: number } => item.raw !== null && item.timestamp !== null)
    .sort((left, right) => right.timestamp - left.timestamp);

  return timestamps[0]?.raw ?? null;
}
