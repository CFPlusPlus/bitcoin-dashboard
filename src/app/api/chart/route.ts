import { mapChartDto } from "../../../domain/dashboard/chart.mapper";
import type { ChartRange } from "../../../domain/dashboard/dto";
import { DEFAULT_CURRENCY, parseCurrency } from "../../../lib/currency";
import { getCacheControlHeader, getChartCachePolicy } from "../../../server/cache";
import { getCoinGeckoStaleWarning, toApiCacheMeta } from "../../../server/cache-meta";
import { getAppEnv } from "../../../server/env";
import { errorResponse, jsonResponse } from "../../../server/http";
import { fetchCoinGeckoMarketChart } from "../../../server/providers/coingecko";
import { upstreamErrorResponse } from "../../../server/upstream";

function isValidRange(value: string | null): value is `${ChartRange}` {
  return value === "1" || value === "7" || value === "30";
}

export async function GET(request: Request) {
  const { COINGECKO_DEMO_API_KEY: apiKey, BITCOIN_DASHBOARD_CACHE: kv } = getAppEnv();

  if (!apiKey) {
    return errorResponse(500, "COINGECKO_DEMO_API_KEY fehlt.");
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  const currencyParam = url.searchParams.get("currency");

  if (!isValidRange(daysParam)) {
    return errorResponse(400, "Ungueltiger days-Parameter. Erlaubt sind nur 1, 7 oder 30.");
  }

  const currency = currencyParam === null ? DEFAULT_CURRENCY : parseCurrency(currencyParam);

  if (!currency) {
    return errorResponse(
      400,
      "Ungueltiger currency-Parameter. Bitte nutze einen unterstuetzten Waehrungscode wie usd, eur oder jpy."
    );
  }

  const days = Number(daysParam) as ChartRange;
  const cachePolicy = getChartCachePolicy(days);

  try {
    const chartProviderResult = await fetchCoinGeckoMarketChart({
      apiKey,
      cachePolicy,
      currency,
      days,
      kv,
    });
    const staleWarning = getCoinGeckoStaleWarning("Chartdaten", chartProviderResult.cache);

    const dto = mapChartDto({
      payload: chartProviderResult.data,
      currency,
      range: days,
      fetchedAt: chartProviderResult.cache.fetchedAt,
      cache: toApiCacheMeta(chartProviderResult.cache),
      warnings: staleWarning ? [staleWarning] : [],
    });

    return jsonResponse(dto, {
      headers: {
        // Longer chart ranges can stay warm longer without affecting the dashboard meaningfully.
        "cache-control": getCacheControlHeader(cachePolicy),
      },
    });
  } catch (error) {
    return upstreamErrorResponse(
      "coingecko",
      error,
      "Fehler beim Laden der Chartdaten von CoinGecko."
    );
  }
}
