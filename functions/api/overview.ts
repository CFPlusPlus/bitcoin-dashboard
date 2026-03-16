type Env = {
  COINGECKO_DEMO_API_KEY?: string;
};

type CoinGeckoSimplePriceResponse = {
  bitcoin?: {
    usd?: number;
    eur?: number;
    usd_market_cap?: number;
    eur_market_cap?: number;
    usd_24h_vol?: number;
    eur_24h_vol?: number;
    usd_24h_change?: number;
    eur_24h_change?: number;
    last_updated_at?: number;
  };
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const apiKey = env.COINGECKO_DEMO_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "COINGECKO_DEMO_API_KEY fehlt.",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }
    );
  }

  const url =
    "https://api.coingecko.com/api/v3/simple/price" +
    "?ids=bitcoin" +
    "&vs_currencies=usd,eur" +
    "&include_market_cap=true" +
    "&include_24hr_vol=true" +
    "&include_24hr_change=true" +
    "&include_last_updated_at=true" +
    "&precision=2";

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    return new Response(
      JSON.stringify({
        error: "Fehler beim Laden der CoinGecko-Daten.",
        status: response.status,
        details: errorText,
      }),
      {
        status: 502,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }
    );
  }

  const data = (await response.json()) as CoinGeckoSimplePriceResponse;
  const btc = data.bitcoin;

  if (!btc) {
    return new Response(
      JSON.stringify({
        error: "Bitcoin-Daten wurden nicht zurückgegeben.",
      }),
      {
        status: 502,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }
    );
  }

  return new Response(
    JSON.stringify({
      name: "bitcoin-dashboard",
      source: "coingecko",
      priceUsd: btc.usd ?? null,
      priceEur: btc.eur ?? null,
      change24hUsd: btc.usd_24h_change ?? null,
      change24hEur: btc.eur_24h_change ?? null,
      marketCapUsd: btc.usd_market_cap ?? null,
      marketCapEur: btc.eur_market_cap ?? null,
      volume24hUsd: btc.usd_24h_vol ?? null,
      volume24hEur: btc.eur_24h_vol ?? null,
      lastUpdatedAt: btc.last_updated_at
        ? new Date(btc.last_updated_at * 1000).toISOString()
        : null,
      fetchedAt: new Date().toISOString(),
    }),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=30",
      },
    }
  );
};