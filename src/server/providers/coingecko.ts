import { z } from "zod";
import type { CachePolicy } from "../cache";
import { readUpstreamJson, requestUpstream } from "../provider-fetch";
import { invalidUpstreamShape, missingUpstreamData } from "../upstream";

const provider = "coingecko";

const finiteNumber = z.number().finite();
const isoString = z.string().min(1);

const coinGeckoMarketItemSchema = z.object({
  current_price: finiteNumber.nullable().optional(),
  market_cap: finiteNumber.nullable().optional(),
  total_volume: finiteNumber.nullable().optional(),
  high_24h: finiteNumber.nullable().optional(),
  low_24h: finiteNumber.nullable().optional(),
  price_change_percentage_24h: finiteNumber.nullable().optional(),
  last_updated: isoString.nullable().optional(),
});

const coinGeckoMarketResponseSchema = z.array(coinGeckoMarketItemSchema);

const coinGeckoChartResponseSchema = z.object({
  prices: z.array(z.tuple([finiteNumber, finiteNumber])),
});

export type CoinGeckoMarketItem = z.infer<typeof coinGeckoMarketItemSchema>;
export type CoinGeckoMarketChartResponse = z.infer<typeof coinGeckoChartResponseSchema>;

function ensureMarketItemCompleteness(item: CoinGeckoMarketItem, currency: "usd" | "eur") {
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

export async function fetchCoinGeckoMarketData(
  currency: "usd" | "eur",
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
    throw missingUpstreamData(provider, `CoinGecko ${currency.toUpperCase()} returned no bitcoin market data.`);
  }

  ensureMarketItemCompleteness(item, currency);

  return item;
}

export async function fetchCoinGeckoMarketChart(input: {
  apiKey: string;
  currency: "usd" | "eur";
  days: 1 | 7 | 30;
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
    throw missingUpstreamData(provider, "CoinGecko chart response did not include any price points.");
  }

  return parsed.data;
}
