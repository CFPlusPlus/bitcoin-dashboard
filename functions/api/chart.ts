import { errorResponse, fetchWithTimeout, jsonResponse, readErrorBody } from "../lib/http";

type Env = {
  COINGECKO_DEMO_API_KEY?: string;
};

type ChartRange = 1 | 7 | 30;
type Currency = "usd" | "eur";

type CoinGeckoMarketChartResponse = {
  prices?: Array<[number, number]>;
};

function isValidRange(value: string | null): value is `${ChartRange}` {
  return value === "1" || value === "7" || value === "30";
}

function isValidCurrency(value: string | null): value is Currency {
  return value === "usd" || value === "eur";
}

function isPoint(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1])
  );
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.COINGECKO_DEMO_API_KEY;

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

  const data = (await response.json()) as CoinGeckoMarketChartResponse;
  const rawPoints = Array.isArray(data.prices) ? data.prices : [];
  const points = rawPoints.filter(isPoint).map(([timestamp, price]) => ({
    timestamp,
    price: Number(price.toFixed(2)),
  }));

  if (points.length === 0) {
    return errorResponse(502, "Keine Chartdaten erhalten.");
  }

  const warnings =
    points.length !== rawPoints.length
      ? ["Einige Chartpunkte konnten nicht verarbeitet werden."]
      : undefined;

  const prices = points.map((point) => point.price);
  const currentPrice = prices[prices.length - 1] ?? null;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return jsonResponse(
    {
      source: "coingecko",
      currency,
      range: days,
      points,
      stats: {
        currentPrice,
        minPrice,
        maxPrice,
      },
      partial: Boolean(warnings),
      warnings,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "public, max-age=60",
      },
    }
  );
};
