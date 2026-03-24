import type { CacheMeta } from "../domain/dashboard/dto";
import type { CoinGeckoCacheMeta } from "./providers/coingecko";

export function toApiCacheMeta(cache: CoinGeckoCacheMeta): CacheMeta {
  return {
    source: cache.source,
    ageSeconds: cache.ageSeconds,
  };
}

export function getCoinGeckoStaleWarning(resource: string, cache: CoinGeckoCacheMeta) {
  if (cache.source !== "stale") {
    return null;
  }

  const ageMinutes = Math.max(1, Math.round(cache.ageSeconds / 60));
  return `${resource} werden aus einem aelteren CoinGecko-Cache bereitgestellt (${ageMinutes} Min. alt).`;
}
