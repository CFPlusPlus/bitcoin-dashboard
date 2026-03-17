import { mapOverviewDto } from "../../../domain/dashboard/overview.mapper";
import { getAppEnv } from "../../../server/env";
import { errorResponse, getReasonMessage, jsonResponse } from "../../../server/http";
import { fetchCoinGeckoMarketData } from "../../../server/providers/coingecko";
import { isUpstreamError } from "../../../server/upstream";

export async function GET() {
  const apiKey = getAppEnv().COINGECKO_DEMO_API_KEY;

  if (!apiKey) {
    return errorResponse(500, "COINGECKO_DEMO_API_KEY fehlt.");
  }

  const [usdResult, eurResult] = await Promise.allSettled([
    fetchCoinGeckoMarketData("usd", apiKey),
    fetchCoinGeckoMarketData("eur", apiKey),
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
    const errors = [usdResult.reason, eurResult.reason].filter(isUpstreamError);

    return errorResponse(502, "Fehler beim Laden der Overview-Daten.", warnings.join(" "), {
      ...(errors.length > 0 ? { codes: [...new Set(errors.map((error) => error.code))] } : {}),
      ...(errors.length > 0
        ? { providers: [...new Set(errors.map((error) => error.provider))] }
        : {}),
    });
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
