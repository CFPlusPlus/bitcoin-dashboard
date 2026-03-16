const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

export async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = 8000
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    const name = typeof error === "object" && error && "name" in error ? String(error.name) : "";

    if (name === "AbortError") {
      throw new Error(`Provider-Timeout nach ${timeoutMs}ms.`);
    }

    throw error instanceof Error ? error : new Error(String(error));
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function readErrorBody(response: Response) {
  const text = await response.text();
  return text.replace(/\s+/g, " ").trim().slice(0, 220);
}

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);

  Object.entries(JSON_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export function errorResponse(
  status: number,
  error: string,
  details?: string,
  extra: Record<string, unknown> = {}
) {
  return jsonResponse(
    {
      error,
      ...(details ? { details } : {}),
      ...extra,
    },
    { status }
  );
}

export function getReasonMessage(prefix: string, reason: unknown) {
  const detail = reason instanceof Error ? reason.message : String(reason);
  return `${prefix}: ${detail}`;
}
