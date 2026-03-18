import { mapPerformanceDto } from "../../../domain/dashboard/performance.mapper";
import type { Currency } from "../../../domain/dashboard/dto";
import { getCacheControlHeader, performanceCachePolicy } from "../../../server/cache";
import { getAppEnv } from "../../../server/env";
import { errorResponse, jsonResponse } from "../../../server/http";
import { fetchCoinGeckoMarketChart } from "../../../server/providers/coingecko";
import { upstreamErrorResponse } from "../../../server/upstream";

function isValidCurrency(value: string | null): value is Currency {
  return value === "usd" || value === "eur";
}

const PERFORMANCE_RANGE_DAYS = 365;

export async function GET(request: Request) {
  const apiKey = getAppEnv().COINGECKO_DEMO_API_KEY;

  if (!apiKey) {
    return errorResponse(500, "COINGECKO_DEMO_API_KEY fehlt.");
  }

  const url = new URL(request.url);
  const currencyParam = url.searchParams.get("currency") ?? "usd";

  if (!isValidCurrency(currencyParam)) {
    return errorResponse(400, "Ungueltiger currency-Parameter. Erlaubt sind nur usd oder eur.");
  }

  try {
    const payload = await fetchCoinGeckoMarketChart({
      apiKey,
      cachePolicy: performanceCachePolicy,
      currency: currencyParam,
      days: PERFORMANCE_RANGE_DAYS,
    });

    const dto = mapPerformanceDto({
      payload,
      currency: currencyParam,
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
