import { z } from "zod";
import type { Currency } from "../../lib/currency";
import type { CachePolicy } from "../cache";
import type { KvNamespaceBinding } from "../env";
import { resolveKvCachedProviderData } from "../kv-cache";
import { readUpstreamJson, requestUpstream } from "../provider-fetch";
import { invalidUpstreamShape, missingUpstreamData } from "../upstream";

const provider = "coingecko";
const KV_KEY_PREFIX = "coingecko:v1";
const MIN_STALE_FALLBACK_SECONDS = 6 * 60 * 60;

const finiteNumber = z.number().finite();
const isoString = z.string().min(1);

const coinGeckoMarketItemSchema = z.object({
  current_price: finiteNumber.nullable().optional(),
  market_cap: finiteNumber.nullable().optional(),
  market_cap_change_24h: finiteNumber.nullable().optional(),
  market_cap_change_percentage_24h: finiteNumber.nullable().optional(),
  market_cap_rank: finiteNumber.nullable().optional(),
  fully_diluted_valuation: finiteNumber.nullable().optional(),
  total_volume: finiteNumber.nullable().optional(),
  high_24h: finiteNumber.nullable().optional(),
  low_24h: finiteNumber.nullable().optional(),
  price_change_percentage_24h: finiteNumber.nullable().optional(),
  circulating_supply: finiteNumber.nullable().optional(),
  max_supply: finiteNumber.nullable().optional(),
  ath: finiteNumber.nullable().optional(),
  ath_change_percentage: finiteNumber.nullable().optional(),
  ath_date: isoString.nullable().optional(),
  atl: finiteNumber.nullable().optional(),
  atl_change_percentage: finiteNumber.nullable().optional(),
  atl_date: isoString.nullable().optional(),
  last_updated: isoString.nullable().optional(),
});

const coinGeckoMarketResponseSchema = z.array(coinGeckoMarketItemSchema);

const coinGeckoChartResponseSchema = z.object({
  prices: z.array(z.tuple([finiteNumber, finiteNumber])),
  market_caps: z.array(z.tuple([finiteNumber, finiteNumber])).optional(),
  total_volumes: z.array(z.tuple([finiteNumber, finiteNumber])).optional(),
});

const coinGeckoGlobalResponseSchema = z.object({
  data: z.object({
    market_cap_percentage: z.object({
      btc: finiteNumber,
    }),
  }),
});

export type CoinGeckoMarketItem = z.infer<typeof coinGeckoMarketItemSchema>;
export type CoinGeckoMarketChartResponse = z.infer<typeof coinGeckoChartResponseSchema>;
export type CoinGeckoGlobalResponse = z.infer<typeof coinGeckoGlobalResponseSchema>;
export type CoinGeckoCacheSource = "api" | "kv" | "stale";
export type CoinGeckoCacheMeta = {
  source: CoinGeckoCacheSource;
  ageSeconds: number;
  fetchedAt: string;
};
export type CoinGeckoCachedResult<T> = {
  data: T;
  cache: CoinGeckoCacheMeta;
};

function ensureMarketItemCompleteness(item: CoinGeckoMarketItem, currency: Currency) {
  const requiredFields = [
    "current_price",
    "market_cap",
    "total_volume",
    "high_24h",
    "low_24h",
    "price_change_percentage_24h",
    "last_updated",
  ] as const;

  const missingFields = requiredFields.filter((field) => item[field] == null);

  if (missingFields.length > 0) {
    throw missingUpstreamData(
      provider,
      `CoinGecko ${currency.toUpperCase()} response missing required fields: ${missingFields.join(", ")}.`
    );
  }
}

function getFreshTtlSeconds(cachePolicy?: CachePolicy) {
  return cachePolicy?.revalidateSeconds ?? 300;
}

function getStaleTtlSeconds(cachePolicy?: CachePolicy) {
  const policyWindow = cachePolicy
    ? cachePolicy.revalidateSeconds + cachePolicy.staleWhileRevalidateSeconds
    : 0;

  return Math.max(MIN_STALE_FALLBACK_SECONDS, policyWindow);
}

function getMarketKey(currency: Currency) {
  return `${KV_KEY_PREFIX}:market:${currency}`;
}

function getChartKey(currency: Currency, days: number) {
  return `${KV_KEY_PREFIX}:chart:${currency}:${days}`;
}

function getGlobalKey() {
  return `${KV_KEY_PREFIX}:global`;
}

function parseMarketCacheEntry(value: unknown, currency: Currency) {
  const parsed = coinGeckoMarketItemSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  try {
    ensureMarketItemCompleteness(parsed.data, currency);
    return parsed.data;
  } catch {
    return null;
  }
}

function parseChartCacheEntry(value: unknown) {
  const parsed = coinGeckoChartResponseSchema.safeParse(value);

  if (!parsed.success || parsed.data.prices.length === 0) {
    return null;
  }

  return parsed.data;
}

function parseGlobalCacheEntry(value: unknown) {
  const parsed = coinGeckoGlobalResponseSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

async function fetchCoinGeckoMarketDataFromApi(
  currency: Currency,
  apiKey: string,
  cachePolicy?: CachePolicy
) {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets" +
    `?vs_currency=${currency}` +
    "&ids=bitcoin" +
    "&precision=2";

  const response = await requestUpstream({
    provider,
    resource: `CoinGecko ${currency.toUpperCase()}`,
    url,
    accept: "application/json",
    timeoutMs: 8000,
    cachePolicy,
    headers: {
      "x-cg-demo-api-key": apiKey,
    },
  });

  const payload = await readUpstreamJson(
    response,
    provider,
    `CoinGecko ${currency.toUpperCase()} returned invalid JSON.`
  );

  const parsed = coinGeckoMarketResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  const item = parsed.data[0];

  if (!item) {
    throw missingUpstreamData(
      provider,
      `CoinGecko ${currency.toUpperCase()} returned no bitcoin market data.`
    );
  }

  ensureMarketItemCompleteness(item, currency);

  return item;
}

async function fetchCoinGeckoMarketChartFromApi(input: {
  apiKey: string;
  currency: Currency;
  days: number;
  cachePolicy?: CachePolicy;
}) {
  const apiUrl =
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart" +
    `?vs_currency=${input.currency}&days=${input.days}&precision=2`;

  const response = await requestUpstream({
    provider,
    resource: "CoinGecko chart",
    url: apiUrl,
    accept: "application/json",
    timeoutMs: 9000,
    cachePolicy: input.cachePolicy,
    headers: {
      "x-cg-demo-api-key": input.apiKey,
    },
  });

  const payload = await readUpstreamJson(
    response,
    provider,
    "CoinGecko chart response returned invalid JSON."
  );

  const parsed = coinGeckoChartResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  if (parsed.data.prices.length === 0) {
    throw missingUpstreamData(
      provider,
      "CoinGecko chart response did not include any price points."
    );
  }

  return parsed.data;
}

async function fetchCoinGeckoGlobalDataFromApi(apiKey: string, cachePolicy?: CachePolicy) {
  const url = "https://api.coingecko.com/api/v3/global";

  const response = await requestUpstream({
    provider,
    resource: "CoinGecko global",
    url,
    accept: "application/json",
    timeoutMs: 8000,
    cachePolicy,
    headers: {
      "x-cg-demo-api-key": apiKey,
    },
  });

  const payload = await readUpstreamJson(
    response,
    provider,
    "CoinGecko global response returned invalid JSON."
  );

  const parsed = coinGeckoGlobalResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  return parsed.data;
}

export async function fetchCoinGeckoMarketData(
  currency: Currency,
  apiKey: string,
  cachePolicy?: CachePolicy,
  kv?: KvNamespaceBinding
): Promise<CoinGeckoCachedResult<CoinGeckoMarketItem>> {
  return resolveKvCachedProviderData({
    kv,
    key: getMarketKey(currency),
    freshTtlSeconds: getFreshTtlSeconds(cachePolicy),
    staleTtlSeconds: getStaleTtlSeconds(cachePolicy),
    fetchFresh: () => fetchCoinGeckoMarketDataFromApi(currency, apiKey, cachePolicy),
    deserialize: (value) => parseMarketCacheEntry(value, currency),
  });
}

export async function fetchCoinGeckoMarketChart(input: {
  apiKey: string;
  currency: Currency;
  days: number;
  cachePolicy?: CachePolicy;
  kv?: KvNamespaceBinding;
}): Promise<CoinGeckoCachedResult<CoinGeckoMarketChartResponse>> {
  return resolveKvCachedProviderData({
    kv: input.kv,
    key: getChartKey(input.currency, input.days),
    freshTtlSeconds: getFreshTtlSeconds(input.cachePolicy),
    staleTtlSeconds: getStaleTtlSeconds(input.cachePolicy),
    fetchFresh: () => fetchCoinGeckoMarketChartFromApi(input),
    deserialize: parseChartCacheEntry,
  });
}

export async function fetchCoinGeckoGlobalData(
  apiKey: string,
  cachePolicy?: CachePolicy,
  kv?: KvNamespaceBinding
): Promise<CoinGeckoCachedResult<CoinGeckoGlobalResponse>> {
  return resolveKvCachedProviderData({
    kv,
    key: getGlobalKey(),
    freshTtlSeconds: getFreshTtlSeconds(cachePolicy),
    staleTtlSeconds: getStaleTtlSeconds(cachePolicy),
    fetchFresh: () => fetchCoinGeckoGlobalDataFromApi(apiKey, cachePolicy),
    deserialize: parseGlobalCacheEntry,
  });
}
