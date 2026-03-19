import { mapMarketContextChartDto } from "../../../domain/dashboard/market-context-chart.mapper";
import type { Currency } from "../../../domain/dashboard/dto";
import { getCacheControlHeader, getChartCachePolicy } from "../../../server/cache";
import { getAppEnv } from "../../../server/env";
import { errorResponse, jsonResponse } from "../../../server/http";
import { fetchCoinGeckoMarketChart } from "../../../server/providers/coingecko";
import { upstreamErrorResponse } from "../../../server/upstream";

function isValidCurrency(value: string | null): value is Currency {
  return value === "usd" || value === "eur";
}

export async function GET(request: Request) {
  const apiKey = getAppEnv().COINGECKO_DEMO_API_KEY;

  if (!apiKey) {
    return errorResponse(500, "COINGECKO_DEMO_API_KEY fehlt.");
  }

  const url = new URL(request.url);
  const currencyParam = url.searchParams.get("currency") ?? "usd";

  if (!isValidCurrency(currencyParam)) {
    return errorResponse(400, "UngÃ¼ltiger currency-Parameter. Erlaubt sind nur usd oder eur.");
  }

  const currency = currencyParam as Currency;
  const cachePolicy = getChartCachePolicy(30);

  try {
    const payload = await fetchCoinGeckoMarketChart({
      apiKey,
      cachePolicy,
      currency,
      days: 30,
    });

    const dto = mapMarketContextChartDto({
      payload,
      currency,
      fetchedAt: new Date().toISOString(),
    });

    return jsonResponse(dto, {
      headers: {
        "cache-control": getCacheControlHeader(cachePolicy),
      },
    });
  } catch (error) {
    return upstreamErrorResponse("coingecko", error, "Fehler beim Laden der Marktkontext-Charts von CoinGecko.");
  }
}
