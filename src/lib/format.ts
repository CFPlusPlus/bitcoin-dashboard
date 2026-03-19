import type { AppLocale } from "../i18n/config";
import { localeMeta } from "../i18n/config";
import { getUnavailableText } from "./dashboard-state-copy";
import type { Currency } from "../types/dashboard";

export const FALLBACK_TEXT = getUnavailableText();

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getNumberLocale(locale: AppLocale, currency?: Currency) {
  if (currency === "usd") {
    return locale === "de" ? "en-US" : localeMeta[locale].bcp47;
  }

  if (currency === "eur") {
    return locale === "de" ? "de-DE" : localeMeta[locale].bcp47;
  }

  return localeMeta[locale].bcp47;
}

export function formatCurrency(value: number | null, currency: Currency, locale: AppLocale = "de") {
  if (!isFiniteNumber(value)) return getUnavailableText(locale);

  return new Intl.NumberFormat(getNumberLocale(locale, currency), {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(
  value: number | null,
  currency: Currency,
  locale: AppLocale = "de",
  maximumFractionDigits = 1
) {
  if (!isFiniteNumber(value)) return getUnavailableText(locale);

  return new Intl.NumberFormat(getNumberLocale(locale, currency), {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits,
  }).format(value);
}

export function formatNumber(value: number | null, locale: AppLocale = "de") {
  if (!isFiniteNumber(value)) return getUnavailableText(locale);
  return new Intl.NumberFormat(getNumberLocale(locale), { maximumFractionDigits: 0 }).format(value);
}

export function formatCompactNumber(
  value: number | null,
  locale: AppLocale = "de",
  maximumFractionDigits = 1
) {
  if (!isFiniteNumber(value)) return getUnavailableText(locale);

  return new Intl.NumberFormat(getNumberLocale(locale), {
    notation: "compact",
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number | null, locale: AppLocale = "de") {
  if (!isFiniteNumber(value)) return getUnavailableText(locale);

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatPercentValue(value: number | null, locale: AppLocale = "de") {
  if (!isFiniteNumber(value)) return getUnavailableText(locale);

  return (
    new Intl.NumberFormat(getNumberLocale(locale), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value) + "%"
  );
}

export function formatDateTime(value: string | null, locale: AppLocale = "de") {
  if (!value) return getUnavailableText(locale);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return getUnavailableText(locale);

  return date.toLocaleString(localeMeta[locale].bcp47);
}

export function formatRelativeTime(
  value: string | null,
  locale: AppLocale = "de",
  now = Date.now()
) {
  if (!value) return getUnavailableText(locale);

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return getUnavailableText(locale);

  const diffMs = now - timestamp;
  const absDiffSeconds = Math.round(Math.abs(diffMs) / 1000);

  if (absDiffSeconds < 45) {
    return diffMs >= 0
      ? locale === "de"
        ? "gerade eben"
        : "just now"
      : locale === "de"
        ? "in wenigen Sekunden"
        : "in a few seconds";
  }

  const formatter = new Intl.RelativeTimeFormat(localeMeta[locale].bcp47, { numeric: "auto" });
  const units = [
    { amount: 60, unit: "second" as const },
    { amount: 60, unit: "minute" as const },
    { amount: 24, unit: "hour" as const },
    { amount: 7, unit: "day" as const },
  ];

  let valueToFormat = diffMs / 1000;

  for (const currentUnit of units) {
    if (Math.abs(valueToFormat) < currentUnit.amount) {
      return formatter.format(-Math.round(valueToFormat), currentUnit.unit);
    }

    valueToFormat /= currentUnit.amount;
  }

  return formatter.format(-Math.round(valueToFormat), "week");
}

export function formatDate(value: string | null, locale: AppLocale = "de") {
  if (!value) return getUnavailableText(locale);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return getUnavailableText(locale);

  return date.toLocaleDateString(localeMeta[locale].bcp47);
}

export function formatCountdown(seconds: number | null, locale: AppLocale = "de") {
  if (!isFiniteNumber(seconds)) return getUnavailableText(locale);
  if (seconds <= 0) return locale === "de" ? "bald" : "soon";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function formatBtc(value: number | null, locale: AppLocale = "de") {
  if (!isFiniteNumber(value)) return getUnavailableText(locale);

  return new Intl.NumberFormat(getNumberLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value);
}
