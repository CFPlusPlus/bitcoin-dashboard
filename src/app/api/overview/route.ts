import {
  mapOverviewDto,
  type CoinGeckoMarketItem,
} from "../../../domain/dashboard/overview.mapper";
import { getAppEnv } from "../../../server/env";
import {
  errorResponse,
  fetchWithTimeout,
  getReasonMessage,
  jsonResponse,
  readErrorBody,
} from "../../../server/http";

async function fetchMarketData(currency: "usd" | "eur", apiKey: string): Promise<CoinGeckoMarketItem> {
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

  const data = (await response.json()) as CoinGeckoMarketItem[];

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

  const dto = mapOverviewDto({
    usd,
    eur,
    fetchedAt: new Date().toISOString(),
    warnings,
  });

  return jsonResponse(dto, {
    headers: {
      "cache-control": "public, max-age=60",
    },
  });
}
