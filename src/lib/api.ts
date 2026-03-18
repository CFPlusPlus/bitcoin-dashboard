import type { AppLocale } from "../i18n/config";
import { getDictionary } from "../i18n/dictionaries";

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

function getErrorMessage(
  status: number,
  payload: ApiErrorPayload | Record<string, unknown> | null,
  rawText: string,
  locale: AppLocale
) {
  const apiPayload = payload as ApiErrorPayload | null;
  const copy = getDictionary(locale).api;
  const message = apiPayload?.error ?? copy.requestFailed.replace("{status}", String(status));
  const details = apiPayload?.details ?? (!payload && rawText ? trimText(rawText) : "");

  return [message, details].filter(Boolean).join(" ");
}

export async function fetchJson<T>(input: string, locale: AppLocale = "de"): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      headers: {
        accept: "application/json",
      },
    });
  } catch {
    throw new Error(getDictionary(locale).api.networkError);
  }

  const rawText = await response.text();
  const payload = parsePayload(rawText);

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, payload, rawText, locale));
  }

  if (!payload) {
    throw new Error(getDictionary(locale).api.emptyResponse);
  }

  return payload as T;
}
