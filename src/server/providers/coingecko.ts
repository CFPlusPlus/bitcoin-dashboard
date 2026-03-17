import { z } from "zod";
import { fetchWithTimeout, readErrorBody } from "../http";
import {
  invalidUpstreamShape,
  missingUpstreamData,
  upstreamFetchFailed,
} from "../upstream";

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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

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

export async function fetchCoinGeckoMarketData(currency: "usd" | "eur", apiKey: string) {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets" +
    `?vs_currency=${currency}` +
    "&ids=bitcoin" +
    "&precision=2";

  let response: Response;

  try {
    response = await fetchWithTimeout(
      url,
      {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": apiKey,
        },
      },
      8000
    );
  } catch (error) {
    throw upstreamFetchFailed(provider, `CoinGecko ${currency.toUpperCase()}: ${getErrorMessage(error)}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw upstreamFetchFailed(
      provider,
      `CoinGecko ${currency.toUpperCase()}: ${response.status} ${details}`.trim(),
      {
        upstreamStatus: response.status,
      }
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    throw invalidUpstreamShape(provider, `CoinGecko ${currency.toUpperCase()} returned invalid JSON.`);
  }

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
}) {
  const apiUrl =
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart" +
    `?vs_currency=${input.currency}&days=${input.days}&precision=2`;

  let response: Response;

  try {
    response = await fetchWithTimeout(
      apiUrl,
      {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": input.apiKey,
        },
      },
      9000
    );
  } catch (error) {
    throw upstreamFetchFailed(provider, `CoinGecko chart request failed: ${getErrorMessage(error)}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw upstreamFetchFailed(provider, `CoinGecko chart request failed: ${response.status} ${details}`.trim(), {
      upstreamStatus: response.status,
    });
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw invalidUpstreamShape(provider, "CoinGecko chart response returned invalid JSON.");
  }

  const parsed = coinGeckoChartResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  if (parsed.data.prices.length === 0) {
    throw missingUpstreamData(provider, "CoinGecko chart response did not include any price points.");
  }

  return parsed.data;
}
