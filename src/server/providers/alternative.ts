import { z } from "zod";
import { fetchWithTimeout, readErrorBody } from "../http";
import {
  invalidUpstreamShape,
  missingUpstreamData,
  upstreamFetchFailed,
} from "../upstream";

const provider = "alternative.me";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

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

export async function fetchFearAndGreedIndex() {
  let response: Response;

  try {
    response = await fetchWithTimeout(
      "https://api.alternative.me/fng/?limit=1",
      {
        headers: {
          accept: "application/json",
        },
      },
      6000
    );
  } catch (error) {
    throw upstreamFetchFailed(provider, `Fear and Greed request failed: ${getErrorMessage(error)}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw upstreamFetchFailed(provider, `Fear and Greed request failed: ${response.status} ${details}`.trim(), {
      upstreamStatus: response.status,
    });
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw invalidUpstreamShape(provider, "Alternative.me response returned invalid JSON.");
  }

  const parsed = alternativeMeResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  return ensurePrimaryItem(parsed.data);
}
