export const onRequestGet: PagesFunction = async () => {
  const body = {
    name: "bitcoin-dashboard",
    btcPriceUsd: 84000,
    btcPriceEur: 77200,
    change24h: 1.8,
    source: "mock",
    updatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=30",
    },
  });
};