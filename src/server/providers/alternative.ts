import { z } from "zod";
import type { CachePolicy } from "../cache";
import { readUpstreamJson, requestUpstream } from "../provider-fetch";
import { invalidUpstreamShape, missingUpstreamData, upstreamFetchFailed } from "../upstream";

const provider = "alternative.me";

const alternativeMeItemSchema = z.object({
  value: z.string().optional(),
  value_classification: z.string().optional(),
  timestamp: z.string().optional(),
  time_until_update: z.string().optional(),
});

const alternativeMeResponseSchema = z.object({
  name: z.string().optional(),
  data: z.array(alternativeMeItemSchema),
  metadata: z
    .object({
      error: z.string().nullable().optional(),
    })
    .optional(),
});

export type AlternativeMeFearAndGreedResponse = z.infer<typeof alternativeMeResponseSchema>;

function ensurePrimaryItem(response: AlternativeMeFearAndGreedResponse) {
  if (response.metadata?.error) {
    throw upstreamFetchFailed(provider, response.metadata.error);
  }

  const item = response.data[0];

  if (!item) {
    throw missingUpstreamData(provider, "Alternative.me returned no Fear and Greed entries.");
  }

  const missingFields = ["value", "timestamp"].filter((field) => !item[field as keyof typeof item]);

  if (missingFields.length > 0) {
    throw missingUpstreamData(
      provider,
      `Alternative.me response missing required fields: ${missingFields.join(", ")}.`
    );
  }

  return response;
}

export async function fetchFearAndGreedIndex(cachePolicy?: CachePolicy) {
  const response = await requestUpstream({
    provider,
    resource: "Fear and Greed",
    url: "https://api.alternative.me/fng/?limit=1",
    accept: "application/json",
    timeoutMs: 6000,
    cachePolicy,
  });

  const payload = await readUpstreamJson(
    response,
    provider,
    "Alternative.me response returned invalid JSON."
  );

  const parsed = alternativeMeResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  return ensurePrimaryItem(parsed.data);
}
