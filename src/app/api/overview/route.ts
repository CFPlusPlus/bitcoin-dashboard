import { getAppEnv } from "../../../server/env";
import {
  errorResponse,
  fetchWithTimeout,
  getReasonMessage,
  jsonResponse,
  readErrorBody,
} from "../../../server/http";

type MarketItem = {
  current_price?: number | null;
  market_cap?: number | null;
  total_volume?: number | null;
  high_24h?: number | null;
  low_24h?: number | null;
  price_change_percentage_24h?: number | null;
  last_updated?: string | null;
};

async function fetchMarketData(currency: "usd" | "eur", apiKey: string): Promise<MarketItem> {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets" +
    `?vs_currency=${currency}` +
    "&ids=bitcoin" +
    "&precision=2";

  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": apiKey,
      },
    },
    8000
  );

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw new Error(`CoinGecko ${currency.toUpperCase()}: ${response.status} ${details}`);
  }

  const data = (await response.json()) as MarketItem[];

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Keine Bitcoin-Marktdaten für ${currency} erhalten.`);
  }

  return data[0];
}

export async function GET() {
  const apiKey = getAppEnv().COINGECKO_DEMO_API_KEY;

  if (!apiKey) {
    return errorResponse(500, "COINGECKO_DEMO_API_KEY fehlt.");
  }

  const [usdResult, eurResult] = await Promise.allSettled([
    fetchMarketData("usd", apiKey),
    fetchMarketData("eur", apiKey),
  ]);

  const warnings: string[] = [];
  const usd = usdResult.status === "fulfilled" ? usdResult.value : null;
  const eur = eurResult.status === "fulfilled" ? eurResult.value : null;

  if (usdResult.status === "rejected") {
    warnings.push(getReasonMessage("USD-Marktdaten nicht verfügbar", usdResult.reason));
  }

  if (eurResult.status === "rejected") {
    warnings.push(getReasonMessage("EUR-Marktdaten nicht verfügbar", eurResult.reason));
  }

  if (!usd && !eur) {
    return errorResponse(502, "Fehler beim Laden der Overview-Daten.", warnings.join(" "));
  }

  return jsonResponse(
    {
      name: "bitcoin-dashboard",
      source: "coingecko",
      priceUsd: usd?.current_price ?? null,
      priceEur: eur?.current_price ?? null,
      change24hUsd: usd?.price_change_percentage_24h ?? null,
      change24hEur: eur?.price_change_percentage_24h ?? null,
      marketCapUsd: usd?.market_cap ?? null,
      marketCapEur: eur?.market_cap ?? null,
      volume24hUsd: usd?.total_volume ?? null,
      volume24hEur: eur?.total_volume ?? null,
      high24hUsd: usd?.high_24h ?? null,
      high24hEur: eur?.high_24h ?? null,
      low24hUsd: usd?.low_24h ?? null,
      low24hEur: eur?.low_24h ?? null,
      lastUpdatedAt: usd?.last_updated ?? eur?.last_updated ?? null,
      partial: warnings.length > 0,
      warnings: warnings.length > 0 ? warnings : undefined,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "public, max-age=60",
      },
    }
  );
}
