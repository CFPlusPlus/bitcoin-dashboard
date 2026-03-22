import { mapPerformanceDto } from "../../../domain/dashboard/performance.mapper";
import { DEFAULT_CURRENCY, parseCurrency } from "../../../lib/currency";
import { getCacheControlHeader, performanceCachePolicy } from "../../../server/cache";
import { getAppEnv } from "../../../server/env";
import { errorResponse, jsonResponse } from "../../../server/http";
import { fetchCoinGeckoMarketChart } from "../../../server/providers/coingecko";
import { upstreamErrorResponse } from "../../../server/upstream";

const PERFORMANCE_RANGE_DAYS = 365;

export async function GET(request: Request) {
  const apiKey = getAppEnv().COINGECKO_DEMO_API_KEY;

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

  try {
    const payload = await fetchCoinGeckoMarketChart({
      apiKey,
      cachePolicy: performanceCachePolicy,
      currency,
      days: PERFORMANCE_RANGE_DAYS,
    });

    const dto = mapPerformanceDto({
      payload,
      currency,
      fetchedAt: new Date().toISOString(),
    });

    return jsonResponse(dto, {
      headers: {
        "cache-control": getCacheControlHeader(performanceCachePolicy),
      },
    });
  } catch (error) {
    return upstreamErrorResponse(
      "coingecko",
      error,
      "Fehler beim Laden der Performance-Daten von CoinGecko."
    );
  }
}
