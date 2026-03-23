import type { AppLocale } from "../i18n/config";
import { getDictionary } from "../i18n/dictionaries";

type DashboardSectionKey =
  | "overview"
  | "ath"
  | "halving"
  | "performance"
  | "chart"
  | "marketContext"
  | "network"
  | "sentiment"
  | "metadata";

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function toLowerText(value: string) {
  return normalizeText(value).toLowerCase();
}

export function getUnavailableText(locale: AppLocale = "de") {
  return getDictionary(locale).common.unavailable;
}

export function sanitizeDashboardErrorMessage(
  error: string | null | undefined,
  fallback: string,
  locale: AppLocale = "de"
) {
  const trimmed = error ? normalizeText(error) : "";

  if (!trimmed) {
    return fallback;
  }

  const normalized = toLowerText(trimmed);
  const copy = getDictionary(locale).dashboard;

  if (normalized.includes("netzwerkfehler") || normalized.includes("network error")) {
    return copy.stateCopy?.sanitizedErrors?.network ?? fallback;
  }

  if (normalized.includes("timeout")) {
    return copy.stateCopy?.sanitizedErrors?.timeout ?? fallback;
  }

  if (normalized.includes("leere antwort") || normalized.includes("empty response")) {
    return copy.stateCopy?.sanitizedErrors?.emptyResponse ?? fallback;
  }

  if (
    normalized.includes("provider") ||
    normalized.includes("coingecko") ||
    normalized.includes("mempool") ||
    normalized.includes("alternative.me") ||
    normalized.includes("anfrage fehlgeschlagen") ||
    normalized.includes("request failed") ||
    normalized.includes("upstream") ||
    /\b\d{3}\b/.test(normalized)
  ) {
    return fallback;
  }

  return trimmed;
}

export function getDashboardSectionStateMessages(
  section: DashboardSectionKey,
  error?: string | null,
  locale: AppLocale = "de"
) {
  const copy = getDictionary(locale).dashboard.stateCopy?.[section];

  if (!copy) {
    throw new Error(`Missing dashboard state copy for section "${section}".`);
  }

  return {
    loading: copy.loading,
    empty: copy.empty,
    error: {
      title: copy.error.title,
      description: sanitizeDashboardErrorMessage(error, copy.error.fallbackDescription, locale),
    },
    partial: copy.partial,
    stale: copy.stale,
  };
}

export function normalizeDashboardWarningMessage(warning: string, locale: AppLocale = "de") {
  const trimmed = normalizeText(warning);
  const normalized = toLowerText(warning);
  const copy = getDictionary(locale).dashboard.stateCopy?.warningNormalization;

  if (!trimmed) {
    return "";
  }

  if (normalized.includes("usd-marktdaten")) {
    return copy?.usdDelayed ?? trimmed;
  }

  if (normalized.includes("eur-marktdaten")) {
    return copy?.eurDelayed ?? trimmed;
  }

  if (normalized.includes("fee-daten")) {
    return copy?.feeDelayed ?? trimmed;
  }

  if (normalized.includes("blockh")) {
    return copy?.blockHeightMissing ?? trimmed;
  }

  if (normalized.includes("chartpunkte")) {
    return copy?.chartPointsMissing ?? trimmed;
  }

  if (normalized.includes("sentiment-update")) {
    return copy?.sentimentUpdateMissing ?? trimmed;
  }

  const prefix = trimmed.split(":")[0]?.trim();

  if (prefix && prefix !== trimmed) {
    return `${prefix}. ${copy?.fallbackSuffix ?? ""}`.trim();
  }

  return trimmed;
}
