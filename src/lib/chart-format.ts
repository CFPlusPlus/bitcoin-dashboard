import type { AppLocale } from "../i18n/config";
import type { ChartRange } from "../types/dashboard";

function getLocaleCode(locale: AppLocale) {
  return locale === "de" ? "de-DE" : "en-US";
}

export function formatChartAxisLabel(timestamp: number, range: ChartRange, locale: AppLocale) {
  const date = new Date(timestamp);

  return new Intl.DateTimeFormat(
    getLocaleCode(locale),
    range === 1
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {
          day: "2-digit",
          month: "2-digit",
        }
  ).format(date);
}

export function formatChartCoverageLabel(timestamp: number, range: ChartRange, locale: AppLocale) {
  const date = new Date(timestamp);

  return new Intl.DateTimeFormat(
    getLocaleCode(locale),
    range === 1
      ? {
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          month: "2-digit",
        }
      : {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
  ).format(date);
}

export function formatChartTooltipLabel(timestamp: number, range: ChartRange, locale: AppLocale) {
  const date = new Date(timestamp);

  return new Intl.DateTimeFormat(
    getLocaleCode(locale),
    range === 1
      ? {
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      : {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
  ).format(date);
}

export function formatChartShortDateLabel(timestamp: number, locale: AppLocale) {
  return new Intl.DateTimeFormat(getLocaleCode(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(timestamp));
}
