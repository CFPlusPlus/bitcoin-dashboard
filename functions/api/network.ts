import { errorResponse, fetchWithTimeout, getReasonMessage, jsonResponse, readErrorBody } from "../lib/http";

type RecommendedFees = {
  fastestFee?: number;
  halfHourFee?: number;
  hourFee?: number;
  economyFee?: number;
  minimumFee?: number;
};

async function fetchRecommendedFees() {
  const response = await fetchWithTimeout(
    "https://mempool.space/api/v1/fees/recommended",
    {
      headers: { accept: "application/json" },
    },
    6000
  );

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw new Error(`Fees: ${response.status} ${details}`);
  }

  return (await response.json()) as RecommendedFees;
}

async function fetchLatestBlockHeight() {
  const response = await fetchWithTimeout(
    "https://mempool.space/api/blocks/tip/height",
    {
      headers: { accept: "text/plain" },
    },
    6000
  );

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw new Error(`Blockhöhe: ${response.status} ${details}`);
  }

  const latestBlockHeight = Number(await response.text());

  if (!Number.isFinite(latestBlockHeight)) {
    throw new Error("Blockhöhe konnte nicht geparst werden.");
  }

  return latestBlockHeight;
}

export const onRequestGet: PagesFunction = async () => {
  const [feesResult, blockHeightResult] = await Promise.allSettled([
    fetchRecommendedFees(),
    fetchLatestBlockHeight(),
  ]);

  const warnings: string[] = [];

  if (feesResult.status === "rejected") {
    warnings.push(getReasonMessage("Fee-Daten nicht verfügbar", feesResult.reason));
  }

  if (blockHeightResult.status === "rejected") {
    warnings.push(getReasonMessage("Blockhöhe nicht verfügbar", blockHeightResult.reason));
  }

  if (feesResult.status === "rejected" && blockHeightResult.status === "rejected") {
    return errorResponse(502, "Fehler beim Laden der mempool.space-Daten.", warnings.join(" "));
  }

  const fees = feesResult.status === "fulfilled" ? feesResult.value : null;
  const latestBlockHeight =
    blockHeightResult.status === "fulfilled" ? blockHeightResult.value : null;

  return jsonResponse(
    {
      source: "mempool.space",
      latestBlockHeight,
      fees: {
        fastestFee: fees?.fastestFee ?? null,
        halfHourFee: fees?.halfHourFee ?? null,
        hourFee: fees?.hourFee ?? null,
        economyFee: fees?.economyFee ?? null,
        minimumFee: fees?.minimumFee ?? null,
      },
      partial: warnings.length > 0,
      warnings: warnings.length > 0 ? warnings : undefined,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "public, max-age=30",
      },
    }
  );
};
