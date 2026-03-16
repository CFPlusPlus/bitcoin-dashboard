type Env = {
  COINGECKO_DEMO_API_KEY?: string;
};

type MarketItem = {
  current_price?: number | null;
  market_cap?: number | null;
  total_volume?: number | null;
  high_24h?: number | null;
  low_24h?: number | null;
  price_change_percentage_24h?: number | null;
  last_updated?: string | null;
};

async function fetchMarketData(
  currency: "usd" | "eur",
  apiKey: string
): Promise<MarketItem> {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets" +
    `?vs_currency=${currency}` +
    "&ids=bitcoin" +
    "&precision=2";

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `CoinGecko markets request failed (${currency}): ${response.status} ${details}`
    );
  }

  const data = (await response.json()) as MarketItem[];

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Keine Bitcoin-Marktdaten für ${currency} erhalten.`);
  }

  return data[0];
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
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

  try {
    const [usd, eur] = await Promise.all([
      fetchMarketData("usd", apiKey),
      fetchMarketData("eur", apiKey),
    ]);

    return new Response(
      JSON.stringify({
        name: "bitcoin-dashboard",
        source: "coingecko",
        priceUsd: usd.current_price ?? null,
        priceEur: eur.current_price ?? null,
        change24hUsd: usd.price_change_percentage_24h ?? null,
        change24hEur: eur.price_change_percentage_24h ?? null,
        marketCapUsd: usd.market_cap ?? null,
        marketCapEur: eur.market_cap ?? null,
        volume24hUsd: usd.total_volume ?? null,
        volume24hEur: eur.total_volume ?? null,
        high24hUsd: usd.high_24h ?? null,
        high24hEur: eur.high_24h ?? null,
        low24hUsd: usd.low_24h ?? null,
        low24hEur: eur.low_24h ?? null,
        lastUpdatedAt: usd.last_updated ?? eur.last_updated ?? null,
        fetchedAt: new Date().toISOString(),
      }),
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=60",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Fehler beim Laden der Overview-Daten.",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 502,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }
};