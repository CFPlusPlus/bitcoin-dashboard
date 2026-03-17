import { mapChartDto, type CoinGeckoMarketChartResponse } from "../../../domain/dashboard/chart.mapper";
import type { ChartRange, Currency } from "../../../domain/dashboard/dto";
import { getAppEnv } from "../../../server/env";
import { errorResponse, fetchWithTimeout, jsonResponse, readErrorBody } from "../../../server/http";

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
  const apiUrl =
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart" +
    `?vs_currency=${currency}&days=${days}&precision=2`;

  let response: Response;

  try {
    response = await fetchWithTimeout(
      apiUrl,
      {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": apiKey,
        },
      },
      9000
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse(502, "Fehler beim Laden der Chartdaten von CoinGecko.", message);
  }

  if (!response.ok) {
    const details = await readErrorBody(response);
    return errorResponse(502, "Fehler beim Laden der Chartdaten von CoinGecko.", details, {
      status: response.status,
    });
  }

  const dto = mapChartDto({
    payload: (await response.json()) as CoinGeckoMarketChartResponse,
    currency,
    range: days,
    fetchedAt: new Date().toISOString(),
  });

  if (dto.points.length === 0) {
    return errorResponse(502, "Keine Chartdaten erhalten.");
  }

  return jsonResponse(dto, {
    headers: {
      "cache-control": "public, max-age=60",
    },
  });
}
