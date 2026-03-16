type FearAndGreedApiResponse = {
  name?: string;
  data?: Array<{
    value?: string;
    value_classification?: string;
    timestamp?: string;
    time_until_update?: string;
  }>;
  metadata?: {
    error?: string | null;
  };
};

export const onRequestGet: PagesFunction = async () => {
  const response = await fetch("https://api.alternative.me/fng/?limit=1", {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        error: "Fehler beim Laden des Fear-&-Greed-Index.",
        status: response.status,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }

  const payload = (await response.json()) as FearAndGreedApiResponse;
  const item = payload.data?.[0];

  if (!item?.value || !item?.timestamp) {
    return new Response(
      JSON.stringify({
        error: "Fear-&-Greed-Daten unvollständig.",
      }),
      {
        status: 502,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }

  const value = Number(item.value);
  const timestamp = Number(item.timestamp);
  const timeUntilUpdateSeconds = item.time_until_update
    ? Number(item.time_until_update)
    : null;

  return new Response(
    JSON.stringify({
      source: "alternative.me",
      name: payload.name ?? "Fear and Greed Index",
      value,
      classification: item.value_classification ?? null,
      timestamp: Number.isFinite(timestamp)
        ? new Date(timestamp * 1000).toISOString()
        : null,
      timeUntilUpdateSeconds,
      nextUpdateAt:
        timeUntilUpdateSeconds !== null
          ? new Date(Date.now() + timeUntilUpdateSeconds * 1000).toISOString()
          : null,
      attribution: "Source: Alternative.me",
      fetchedAt: new Date().toISOString(),
    }),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    }
  );
};