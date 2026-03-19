import type { CachePolicy } from "./cache";
import { getNextFetchCacheOptions } from "./cache";
import { fetchWithTimeout, readErrorBody } from "./http";
import { invalidUpstreamShape, upstreamFetchFailed } from "./upstream";

type UpstreamAcceptHeader = "application/json" | "text/plain";

type RequestUpstreamOptions = {
  provider: string;
  resource: string;
  url: string;
  accept: UpstreamAcceptHeader;
  timeoutMs: number;
  cachePolicy?: CachePolicy;
  headers?: HeadersInit;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function buildUpstreamHeaders(accept: UpstreamAcceptHeader, headers?: HeadersInit) {
  const mergedHeaders = new Headers(headers);
  mergedHeaders.set("accept", accept);
  return mergedHeaders;
}

export async function requestUpstream({
  provider,
  resource,
  url,
  accept,
  timeoutMs,
  cachePolicy,
  headers,
}: RequestUpstreamOptions) {
  let response: Response;

  try {
    response = await fetchWithTimeout(
      url,
      {
        ...(cachePolicy ? getNextFetchCacheOptions(cachePolicy) : {}),
        headers: buildUpstreamHeaders(accept, headers),
      },
      timeoutMs
    );
  } catch (error) {
    throw upstreamFetchFailed(provider, `${resource} request failed: ${getErrorMessage(error)}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw upstreamFetchFailed(
      provider,
      `${resource} request failed: ${response.status} ${details}`.trim(),
      {
        upstreamStatus: response.status,
      }
    );
  }

  return response;
}

export async function readUpstreamJson(
  response: Response,
  provider: string,
  invalidJsonMessage: string
) {
  try {
    return await response.json();
  } catch {
    throw invalidUpstreamShape(provider, invalidJsonMessage);
  }
}
