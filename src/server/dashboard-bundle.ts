import type { DashboardBundleSection } from "../types/dashboard";

type ErrorPayload = {
  error?: string;
  details?: string;
};

function parsePayload(text: string): ErrorPayload | Record<string, unknown> | null {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as ErrorPayload | Record<string, unknown>;
  } catch {
    return null;
  }
}

function trimText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 220);
}

function getErrorMessage(
  status: number,
  payload: ErrorPayload | Record<string, unknown> | null,
  rawText: string
) {
  const apiPayload = payload as ErrorPayload | null;
  const message = apiPayload?.error?.trim() || `Request fehlgeschlagen (${status}).`;
  const details = apiPayload?.details?.trim() || (!payload && rawText ? trimText(rawText) : "");

  return [message, details].filter(Boolean).join(" ");
}

export async function executeBundledSection<T>(
  load: () => Promise<Response>
): Promise<DashboardBundleSection<T>> {
  try {
    const response = await load();
    const rawText = await response.text();
    const payload = parsePayload(rawText);

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: getErrorMessage(response.status, payload, rawText),
          status: response.status,
        },
      };
    }

    if (!payload) {
      return {
        data: null,
        error: {
          message: "Leere Antwort vom Server.",
          status: response.status,
        },
      };
    }

    return {
      data: payload as T,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : String(error),
        status: 500,
      },
    };
  }
}
