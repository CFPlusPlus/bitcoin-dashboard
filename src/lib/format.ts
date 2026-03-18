import { getUnavailableText } from "./dashboard-state-copy";
import type { Currency } from "../types/dashboard";

export const FALLBACK_TEXT = getUnavailableText();

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatCurrency(value: number | null, currency: Currency) {
  if (!isFiniteNumber(value)) return FALLBACK_TEXT;

  return new Intl.NumberFormat(currency === "usd" ? "en-US" : "de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null) {
  if (!isFiniteNumber(value)) return FALLBACK_TEXT;
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number | null) {
  if (!isFiniteNumber(value)) return FALLBACK_TEXT;

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDateTime(value: string | null) {
  if (!value) return FALLBACK_TEXT;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return FALLBACK_TEXT;

  return date.toLocaleString("de-DE");
}

export function formatRelativeTime(value: string | null, now = Date.now()) {
  if (!value) return FALLBACK_TEXT;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return FALLBACK_TEXT;

  const diffMs = now - timestamp;
  const absDiffSeconds = Math.round(Math.abs(diffMs) / 1000);

  if (absDiffSeconds < 45) {
    return diffMs >= 0 ? "gerade eben" : "in wenigen Sekunden";
  }

  const formatter = new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" });
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

export function formatDate(value: string | null) {
  if (!value) return FALLBACK_TEXT;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return FALLBACK_TEXT;

  return date.toLocaleDateString("de-DE");
}

export function formatCountdown(seconds: number | null) {
  if (!isFiniteNumber(seconds)) return FALLBACK_TEXT;
  if (seconds <= 0) return "bald";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function formatBtc(value: number | null) {
  if (!isFiniteNumber(value)) return FALLBACK_TEXT;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value);
}
