type RecommendedFees = {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee?: number;
  minimumFee?: number;
};

export const onRequestGet: PagesFunction = async () => {
  const [feesResponse, tipHeightResponse] = await Promise.all([
    fetch("https://mempool.space/api/v1/fees/recommended", {
      headers: { accept: "application/json" },
    }),
    fetch("https://mempool.space/api/blocks/tip/height", {
      headers: { accept: "text/plain" },
    }),
  ]);

  if (!feesResponse.ok || !tipHeightResponse.ok) {
    return new Response(
      JSON.stringify({
        error: "Fehler beim Laden der mempool.space-Daten.",
        feesStatus: feesResponse.status,
        tipHeightStatus: tipHeightResponse.status,
      }),
      {
        status: 502,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }
    );
  }

  const fees = (await feesResponse.json()) as RecommendedFees;
  const latestBlockHeight = Number(await tipHeightResponse.text());

  return new Response(
    JSON.stringify({
      source: "mempool.space",
      latestBlockHeight,
      fees: {
        fastestFee: fees.fastestFee ?? null,
        halfHourFee: fees.halfHourFee ?? null,
        hourFee: fees.hourFee ?? null,
        economyFee: fees.economyFee ?? null,
        minimumFee: fees.minimumFee ?? null,
      },
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