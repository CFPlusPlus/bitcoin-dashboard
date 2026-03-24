import type { ChartRange } from "../domain/dashboard/dto";

export type CachePolicy = {
  revalidateSeconds: number;
  staleWhileRevalidateSeconds: number;
  browserMaxAgeSeconds: number;
};

export const overviewCachePolicy: CachePolicy = {
  revalidateSeconds: 300,
  staleWhileRevalidateSeconds: 900,
  browserMaxAgeSeconds: 60,
};

export function getChartCachePolicy(range: ChartRange): CachePolicy {
  if (range === 1) {
    return {
      revalidateSeconds: 300,
      staleWhileRevalidateSeconds: 900,
      browserMaxAgeSeconds: 60,
    };
  }

  if (range === 7) {
    return {
      revalidateSeconds: 300,
      staleWhileRevalidateSeconds: 900,
      browserMaxAgeSeconds: 60,
    };
  }

  return {
    revalidateSeconds: 900,
    staleWhileRevalidateSeconds: 1800,
    browserMaxAgeSeconds: 300,
  };
}

export const performanceCachePolicy: CachePolicy = {
  revalidateSeconds: 1800,
  staleWhileRevalidateSeconds: 7200,
  browserMaxAgeSeconds: 300,
};

export const networkCachePolicy: CachePolicy = {
  revalidateSeconds: 20,
  staleWhileRevalidateSeconds: 40,
  browserMaxAgeSeconds: 5,
};

export const sentimentCachePolicy: CachePolicy = {
  revalidateSeconds: 900,
  staleWhileRevalidateSeconds: 3600,
  browserMaxAgeSeconds: 300,
};

export const onChainActivityCachePolicy: CachePolicy = {
  revalidateSeconds: 1800,
  staleWhileRevalidateSeconds: 7200,
  browserMaxAgeSeconds: 300,
};

export const dashboardCoreCachePolicy: CachePolicy = {
  revalidateSeconds: 120,
  staleWhileRevalidateSeconds: 240,
  browserMaxAgeSeconds: 30,
};

export const dashboardSlowCachePolicy: CachePolicy = {
  revalidateSeconds: 900,
  staleWhileRevalidateSeconds: 3600,
  browserMaxAgeSeconds: 300,
};

export function getCacheControlHeader(policy: CachePolicy) {
  return (
    `public, max-age=${policy.browserMaxAgeSeconds}, ` +
    `s-maxage=${policy.revalidateSeconds}, ` +
    `stale-while-revalidate=${policy.staleWhileRevalidateSeconds}`
  );
}

export function getNextFetchCacheOptions(policy: CachePolicy) {
  return {
    cache: "force-cache" as const,
    next: {
      revalidate: policy.revalidateSeconds,
    },
  };
}
