import { mapChartDto } from "../../../domain/dashboard/chart.mapper";
import type { ChartRange, Currency } from "../../../domain/dashboard/dto";
import { getAppEnv } from "../../../server/env";
import { errorResponse, jsonResponse } from "../../../server/http";
import { fetchCoinGeckoMarketChart } from "../../../server/providers/coingecko";
import { upstreamErrorResponse } from "../../../server/upstream";

function isValidRange(value: string | null): value is `${ChartRange}` {
  return value === "1" || value === "7" || value === "30";
}

function isValidCurrency(value: string | null): value is Currency {
  return value === "usd" || value === "eur";
}

export async function GET(request: Request) {
  const apiKey = getAppEnv().COINGECKO_DEMO_API_KEY;

  if (!apiKey) {
    return errorResponse(500, "COINGECKO_DEMO_API_KEY fehlt.");
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  const currencyParam = url.searchParams.get("currency") ?? "usd";

  if (!isValidRange(daysParam)) {
    return errorResponse(400, "Ungültiger days-Parameter. Erlaubt sind nur 1, 7 oder 30.");
  }

  if (!isValidCurrency(currencyParam)) {
    return errorResponse(400, "Ungültiger currency-Parameter. Erlaubt sind nur usd oder eur.");
  }

  const days = Number(daysParam) as ChartRange;
  const currency = currencyParam as Currency;

  try {
    const payload = await fetchCoinGeckoMarketChart({
      apiKey,
      currency,
      days,
    });

    const dto = mapChartDto({
      payload,
      currency,
      range: days,
      fetchedAt: new Date().toISOString(),
    });

    return jsonResponse(dto, {
      headers: {
        "cache-control": "public, max-age=60",
      },
    });
  } catch (error) {
    return upstreamErrorResponse("coingecko", error, "Fehler beim Laden der Chartdaten von CoinGecko.");
  }
}
