import { mapOverviewDto } from "../../../domain/dashboard/overview.mapper";
import { DEFAULT_CURRENCY, parseCurrency } from "../../../lib/currency";
import { getCacheControlHeader, overviewCachePolicy } from "../../../server/cache";
import { getCoinGeckoStaleWarning, toApiCacheMeta } from "../../../server/cache-meta";
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

export async function GET(request: Request) {
  const { COINGECKO_DEMO_API_KEY: apiKey, BITCOIN_DASHBOARD_CACHE: kv } = getAppEnv();

  if (!apiKey) {
    return errorResponse(500, "COINGECKO_DEMO_API_KEY fehlt.");
  }

  const url = new URL(request.url);
  const currencyParam = url.searchParams.get("currency");
  const currency = currencyParam === null ? DEFAULT_CURRENCY : parseCurrency(currencyParam);

  if (!currency) {
    return errorResponse(
      400,
      "Ungueltiger currency-Parameter. Bitte nutze einen unterstuetzten Waehrungscode wie usd, eur oder jpy."
    );
  }

  const usdReferencePromise =
    currency === "usd"
      ? Promise.resolve(null)
      : fetchCoinGeckoMarketData("usd", apiKey, overviewCachePolicy, kv);

  const [marketResult, usdReferenceResult, globalResult] = await Promise.allSettled([
    fetchCoinGeckoMarketData(currency, apiKey, overviewCachePolicy, kv),
    usdReferencePromise,
    fetchCoinGeckoGlobalData(apiKey, overviewCachePolicy, kv),
  ]);

  const warnings: string[] = [];
  const marketProviderResult = marketResult.status === "fulfilled" ? marketResult.value : null;
  const usdReferenceProviderResult =
    currency === "usd"
      ? marketProviderResult
      : usdReferenceResult.status === "fulfilled"
        ? usdReferenceResult.value
        : null;
  const globalProviderResult = globalResult.status === "fulfilled" ? globalResult.value : null;
  const market = marketProviderResult?.data ?? null;
  const usdReferenceMarket =
    currency === "usd" ? market : (usdReferenceProviderResult?.data ?? null);
  const btcDominance = globalProviderResult?.data.data.market_cap_percentage.btc ?? null;

  if (marketResult.status === "rejected") {
    warnings.push(
      getReasonMessage(`${currency.toUpperCase()}-Marktdaten nicht verfuegbar`, marketResult.reason)
    );
  }

  if (currency !== "usd" && usdReferenceResult.status === "rejected") {
    warnings.push(getReasonMessage("USD-Referenzkurs nicht verfuegbar", usdReferenceResult.reason));
  }

  if (globalResult.status === "rejected") {
    warnings.push(getReasonMessage("Globale Marktdaten nicht verfuegbar", globalResult.reason));
  }

  const marketStaleWarning =
    marketProviderResult !== null
      ? getCoinGeckoStaleWarning(`${currency.toUpperCase()}-Marktdaten`, marketProviderResult.cache)
      : null;

  if (marketStaleWarning) {
    warnings.push(marketStaleWarning);
  }

  if (currency !== "usd" && usdReferenceProviderResult !== null) {
    const usdStaleWarning = getCoinGeckoStaleWarning(
      "USD-Referenzkurs",
      usdReferenceProviderResult.cache
    );

    if (usdStaleWarning) {
      warnings.push(usdStaleWarning);
    }
  }

  if (globalProviderResult !== null) {
    const globalStaleWarning = getCoinGeckoStaleWarning(
      "Globale Marktdaten",
      globalProviderResult.cache
    );

    if (globalStaleWarning) {
      warnings.push(globalStaleWarning);
    }
  }

  if (!marketProviderResult || !market) {
    const errors = [getRejectedReason(marketResult)].filter(isUpstreamError);

    return errorResponse(502, "Fehler beim Laden der Overview-Daten.", warnings.join(" "), {
      ...(errors.length > 0 ? { codes: [...new Set(errors.map((error) => error.code))] } : {}),
      ...(errors.length > 0
        ? { providers: [...new Set(errors.map((error) => error.provider))] }
        : {}),
    });
  }

  const dto = mapOverviewDto({
    market,
    referenceUsdMarket: usdReferenceMarket,
    currency,
    btcDominance,
    fetchedAt: marketProviderResult.cache.fetchedAt,
    cache: toApiCacheMeta(marketProviderResult.cache),
    warnings,
  });

  return jsonResponse(dto, {
    headers: {
      // Keep browsers reasonably fresh while letting the edge serve a short-lived snapshot.
      "cache-control": getCacheControlHeader(overviewCachePolicy),
    },
  });
}
