import { mapMarketContextChartDto } from "../../../domain/dashboard/market-context-chart.mapper";
import { DEFAULT_CURRENCY, parseCurrency } from "../../../lib/currency";
import { getCacheControlHeader, getChartCachePolicy } from "../../../server/cache";
import { getCoinGeckoStaleWarning, toApiCacheMeta } from "../../../server/cache-meta";
import { getAppEnv } from "../../../server/env";
import { errorResponse, jsonResponse } from "../../../server/http";
import { fetchCoinGeckoMarketChart } from "../../../server/providers/coingecko";
import { upstreamErrorResponse } from "../../../server/upstream";

export async function GET(request: Request) {
  const { COINGECKO_DEMO_API_KEY: apiKey, BITCOIN_DASHBOARD_CACHE: kv } = getAppEnv();

  if (!apiKey) {
    return errorResponse(500, "COINGECKO_DEMO_API_KEY fehlt.");
  }

  const url = new URL(request.url);
  const currencyParam = url.searchParams.get("currency");
  const currency = currencyParam === null ? DEFAULT_CURRENCY : parseCurrency(currencyParam);

  if (!currency) {
    return errorResponse(
      400,
      "Ungueltiger currency-Parameter. Bitte nutze einen unterstuetzten Waehrungscode wie usd, eur oder jpy."
    );
  }

  const cachePolicy = getChartCachePolicy(30);

  try {
    const marketContextProviderResult = await fetchCoinGeckoMarketChart({
      apiKey,
      cachePolicy,
      currency,
      days: 30,
      kv,
    });
    const staleWarning = getCoinGeckoStaleWarning(
      "Marktkontext-Chartdaten",
      marketContextProviderResult.cache
    );

    const dto = mapMarketContextChartDto({
      payload: marketContextProviderResult.data,
      currency,
      fetchedAt: marketContextProviderResult.cache.fetchedAt,
      cache: toApiCacheMeta(marketContextProviderResult.cache),
      warnings: staleWarning ? [staleWarning] : [],
    });

    return jsonResponse(dto, {
      headers: {
        "cache-control": getCacheControlHeader(cachePolicy),
      },
    });
  } catch (error) {
    return upstreamErrorResponse(
      "coingecko",
      error,
      "Fehler beim Laden der Marktkontext-Charts von CoinGecko."
    );
  }
}
