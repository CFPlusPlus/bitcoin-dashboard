type Env = {
  COINGECKO_DEMO_API_KEY?: string;
};

type ChartRange = 1 | 7 | 30;
type Currency = "usd" | "eur";

type CoinGeckoMarketChartResponse = {
  prices?: [number, number][];
  market_caps?: [number, number][];
  total_volumes?: [number, number][];
};

function isValidRange(value: string | null): value is `${ChartRange}` {
  return value === "1" || value === "7" || value === "30";
}

function isValidCurrency(value: string | null): value is Currency {
  return value === "usd" || value === "eur";
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.COINGECKO_DEMO_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "COINGECKO_DEMO_API_KEY fehlt." }),
      {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  const currencyParam = url.searchParams.get("currency") ?? "usd";

  if (!isValidRange(daysParam)) {
    return new Response(
      JSON.stringify({
        error: "Ungültiger days-Parameter. Erlaubt sind nur 1, 7 oder 30.",
      }),
      {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }

  if (!isValidCurrency(currencyParam)) {
    return new Response(
      JSON.stringify({
        error: "Ungültiger currency-Parameter. Erlaubt sind nur usd oder eur.",
      }),
      {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }

  const days = Number(daysParam) as ChartRange;
  const currency = currencyParam as Currency;

  const apiUrl =
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart" +
    `?vs_currency=${currency}&days=${days}&precision=2`;

  const response = await fetch(apiUrl, {
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const details = await response.text();

    return new Response(
      JSON.stringify({
        error: "Fehler beim Laden der Chartdaten von CoinGecko.",
        status: response.status,
        details,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }

  const data = (await response.json()) as CoinGeckoMarketChartResponse;
  const rawPoints = data.prices ?? [];

  if (rawPoints.length === 0) {
    return new Response(
      JSON.stringify({ error: "Keine Chartdaten erhalten." }),
      {
        status: 502,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }

  const points = rawPoints.map(([timestamp, price]) => ({
    timestamp,
    price: Number(price.toFixed(2)),
  }));

  const prices = points.map((point) => point.price);
  const currentPrice = prices[prices.length - 1] ?? null;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return new Response(
    JSON.stringify({
      source: "coingecko",
      currency,
      range: days,
      points,
      stats: {
        currentPrice,
        minPrice,
        maxPrice,
      },
      fetchedAt: new Date().toISOString(),
    }),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    }
  );
};