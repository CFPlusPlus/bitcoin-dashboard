type ApiErrorPayload = {
  error?: string;
  details?: string;
};

function parsePayload(text: string): ApiErrorPayload | Record<string, unknown> | null {
  if (!text) return null;

  try {
    return JSON.parse(text) as ApiErrorPayload | Record<string, unknown>;
  } catch {
    return null;
  }
}

function trimText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 220);
}

function getErrorMessage(status: number, payload: ApiErrorPayload | Record<string, unknown> | null, rawText: string) {
  const apiPayload = payload as ApiErrorPayload | null;
  const message = apiPayload?.error ?? `Anfrage fehlgeschlagen (${status}).`;
  const details = apiPayload?.details ?? (!payload && rawText ? trimText(rawText) : "");

  return [message, details].filter(Boolean).join(" ");
}

export async function fetchJson<T>(input: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      headers: {
        accept: "application/json",
      },
    });
  } catch {
    throw new Error("Netzwerkfehler. Bitte später erneut versuchen.");
  }

  const rawText = await response.text();
  const payload = parsePayload(rawText);

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, payload, rawText));
  }

  if (!payload) {
    throw new Error("Leere Antwort vom Server erhalten.");
  }

  return payload as T;
}
