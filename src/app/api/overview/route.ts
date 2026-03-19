import { mapOverviewDto } from "../../../domain/dashboard/overview.mapper";
import { getCacheControlHeader, overviewCachePolicy } from "../../../server/cache";
import { getAppEnv } from "../../../server/env";
import { errorResponse, getReasonMessage, jsonResponse } from "../../../server/http";
import {
  fetchCoinGeckoGlobalData,
  fetchCoinGeckoMarketData,
} from "../../../server/providers/coingecko";
import { isUpstreamError } from "../../../server/upstream";

function getRejectedReason<T>(result: PromiseSettledResult<T>) {
  return result.status === "rejected" ? result.reason : null;
}

export async function GET() {
  const apiKey = getAppEnv().COINGECKO_DEMO_API_KEY;

  if (!apiKey) {
    return errorResponse(500, "COINGECKO_DEMO_API_KEY fehlt.");
  }

  const [usdResult, eurResult, globalResult] = await Promise.allSettled([
    fetchCoinGeckoMarketData("usd", apiKey, overviewCachePolicy),
    fetchCoinGeckoMarketData("eur", apiKey, overviewCachePolicy),
    fetchCoinGeckoGlobalData(apiKey, overviewCachePolicy),
  ]);

  const warnings: string[] = [];
  const usd = usdResult.status === "fulfilled" ? usdResult.value : null;
  const eur = eurResult.status === "fulfilled" ? eurResult.value : null;
  const btcDominance =
    globalResult.status === "fulfilled" ? globalResult.value.data.market_cap_percentage.btc : null;

  if (usdResult.status === "rejected") {
    warnings.push(getReasonMessage("USD-Marktdaten nicht verfügbar", usdResult.reason));
  }

  if (eurResult.status === "rejected") {
    warnings.push(getReasonMessage("EUR-Marktdaten nicht verfügbar", eurResult.reason));
  }

  if (globalResult.status === "rejected") {
    warnings.push(getReasonMessage("Globale Marktdaten nicht verfÃ¼gbar", globalResult.reason));
  }

  if (!usd && !eur) {
    const errors = [getRejectedReason(usdResult), getRejectedReason(eurResult)].filter(
      isUpstreamError
    );

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
    btcDominance,
    fetchedAt: new Date().toISOString(),
    warnings,
  });

  return jsonResponse(dto, {
    headers: {
      // Keep browsers reasonably fresh while letting the edge serve a short-lived snapshot.
      "cache-control": getCacheControlHeader(overviewCachePolicy),
    },
  });
}
