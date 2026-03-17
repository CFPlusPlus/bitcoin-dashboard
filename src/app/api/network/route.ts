import {
  mapNetworkDto,
  type MempoolRecommendedFees,
} from "../../../domain/dashboard/network.mapper";
import {
  errorResponse,
  fetchWithTimeout,
  getReasonMessage,
  jsonResponse,
  readErrorBody,
} from "../../../server/http";

async function fetchRecommendedFees(): Promise<MempoolRecommendedFees> {
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

  return (await response.json()) as MempoolRecommendedFees;
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

export async function GET() {
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

  const dto = mapNetworkDto({
    fees: feesResult.status === "fulfilled" ? feesResult.value : null,
    latestBlockHeight: blockHeightResult.status === "fulfilled" ? blockHeightResult.value : null,
    fetchedAt: new Date().toISOString(),
    warnings,
  });

  return jsonResponse(dto, {
    headers: {
      "cache-control": "public, max-age=30",
    },
  });
}
