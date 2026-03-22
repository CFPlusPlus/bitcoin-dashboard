import type {
  Currency,
  DcaEntry,
  DcaEntrySnapshot,
  DcaEntryStore,
  DcaSummary,
  Overview,
} from "../types/dashboard";
import type { AppLocale } from "../i18n/config";
import { getDictionary } from "../i18n/dictionaries";
import { isCurrency as isSupportedCurrency } from "./currency";

export type DcaFormInput = {
  amountInvested: string;
  bitcoinPrice: string;
  date: string;
  note: string;
};

type DcaDraftEntry = Omit<DcaEntry, "id">;

export type DcaValidationResult =
  | {
      error: string;
      field: "amountInvested" | "bitcoinPrice" | "date";
      success: false;
    }
  | {
      success: true;
      value: DcaDraftEntry;
    };

export const EMPTY_DCA_ENTRY_STORE: DcaEntryStore = {};

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveNumber(value: number | null | undefined): value is number {
  return isFiniteNumber(value) && value > 0;
}

function normalizeDecimalInput(value: string) {
  return value.trim().replace(",", ".");
}

function sanitizeNote(note: string) {
  return note.trim();
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeDcaEntry(entry: DcaEntry): DcaEntry {
  return {
    ...entry,
    note: sanitizeNote(entry.note),
  };
}

export const isCurrency = isSupportedCurrency;

export function isDcaEntry(value: unknown): value is DcaEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    typeof entry.date === "string" &&
    isValidDateString(entry.date) &&
    typeof entry.note === "string" &&
    isPositiveNumber(entry.amountInvested as number | null | undefined) &&
    isPositiveNumber(entry.bitcoinPrice as number | null | undefined)
  );
}

export function normalizeDcaEntryStore(value: unknown, initialValue = EMPTY_DCA_ENTRY_STORE) {
  if (typeof value !== "object" || value === null) {
    return initialValue;
  }

  const store = value as Record<string, unknown>;
  const normalizedStore: DcaEntryStore = {};

  for (const [currency, entries] of Object.entries(store)) {
    if (!isSupportedCurrency(currency) || !Array.isArray(entries)) {
      continue;
    }

    normalizedStore[currency] = entries.filter(isDcaEntry).map(normalizeDcaEntry);
  }

  return normalizedStore;
}

export function isDcaEntryStore(value: unknown): value is DcaEntryStore {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const store = value as Record<string, unknown>;
  return Object.entries(store).every(
    ([currency, entries]) =>
      isSupportedCurrency(currency) && Array.isArray(entries) && entries.every(isDcaEntry)
  );
}

export function createDcaEntryId(now = Date.now(), random = Math.random()) {
  return `${now}-${random.toString(36).slice(2, 8)}`;
}

export function getCurrentPrice(overview: Overview | null, currency: Currency) {
  if (!overview || overview.currency !== currency) {
    return null;
  }

  const price = overview.price;
  return isPositiveNumber(price) ? price : null;
}

export function getDefaultDcaDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function getDcaTone(value: number | null) {
  if (value === null || value === 0) {
    return "default";
  }

  return value > 0 ? "positive" : "negative";
}

export function validateDcaFormInput(
  input: DcaFormInput,
  locale: AppLocale = "de"
): DcaValidationResult {
  const copy = getDictionary(locale).dca.validation;

  if (input.date.trim().length === 0) {
    return {
      error: copy.missingDate,
      field: "date",
      success: false,
    };
  }

  if (!isValidDateString(input.date)) {
    return {
      error: copy.invalidDate,
      field: "date",
      success: false,
    };
  }

  if (input.date > getDefaultDcaDate()) {
    return {
      error: copy.futureDate,
      field: "date",
      success: false,
    };
  }

  if (input.amountInvested.trim().length === 0) {
    return {
      error: copy.missingAmount,
      field: "amountInvested",
      success: false,
    };
  }

  const amountInvested = Number(normalizeDecimalInput(input.amountInvested));

  if (!isPositiveNumber(amountInvested)) {
    return {
      error: copy.invalidAmount,
      field: "amountInvested",
      success: false,
    };
  }

  if (input.bitcoinPrice.trim().length === 0) {
    return {
      error: copy.missingBitcoinPrice,
      field: "bitcoinPrice",
      success: false,
    };
  }

  const bitcoinPrice = Number(normalizeDecimalInput(input.bitcoinPrice));

  if (!isPositiveNumber(bitcoinPrice)) {
    return {
      error: copy.invalidBitcoinPrice,
      field: "bitcoinPrice",
      success: false,
    };
  }

  return {
    success: true,
    value: {
      amountInvested,
      bitcoinPrice,
      date: input.date,
      note: sanitizeNote(input.note),
    },
  };
}

export function createDcaEntry(
  input: DcaFormInput,
  locale: AppLocale = "de",
  entryId = createDcaEntryId()
) {
  const validation = validateDcaFormInput(input, locale);

  if (!validation.success) {
    return validation;
  }

  return {
    success: true as const,
    value: {
      ...validation.value,
      id: entryId,
    },
  };
}

export function addDcaEntry(
  store: DcaEntryStore,
  currency: Currency,
  entry: DcaEntry
): DcaEntryStore {
  const currentEntries = store[currency] ?? [];

  return {
    ...store,
    [currency]: [normalizeDcaEntry(entry), ...currentEntries],
  };
}

export function removeDcaEntry(
  store: DcaEntryStore,
  currency: Currency,
  entryId: string
): DcaEntryStore {
  const currentEntries = store[currency] ?? [];

  return {
    ...store,
    [currency]: currentEntries.filter((entry) => entry.id !== entryId),
  };
}

export function clearDcaEntries(store: DcaEntryStore, currency: Currency): DcaEntryStore {
  return {
    ...store,
    [currency]: [],
  };
}

export function calculateBitcoinAmount(amountInvested: number, bitcoinPrice: number) {
  if (!isPositiveNumber(amountInvested) || !isPositiveNumber(bitcoinPrice)) {
    return 0;
  }

  return amountInvested / bitcoinPrice;
}

export function buildDcaEntries(entries: DcaEntry[]): DcaEntrySnapshot[] {
  return entries.filter(isDcaEntry).map((entry) => {
    const normalizedEntry = normalizeDcaEntry(entry);

    return {
      ...normalizedEntry,
      bitcoinAmount: calculateBitcoinAmount(
        normalizedEntry.amountInvested,
        normalizedEntry.bitcoinPrice
      ),
    };
  });
}

export function buildDcaSummary(
  entries: DcaEntrySnapshot[],
  currentPrice: number | null
): DcaSummary {
  const normalizedCurrentPrice = isPositiveNumber(currentPrice) ? currentPrice : null;
  const totalEntries = entries.length;
  const totalInvested = entries.reduce((sum, entry) => sum + entry.amountInvested, 0);
  const totalBitcoin = entries.reduce((sum, entry) => sum + entry.bitcoinAmount, 0);
  const averageBuyPrice = totalBitcoin > 0 ? totalInvested / totalBitcoin : null;
  const currentValue =
    normalizedCurrentPrice !== null && totalBitcoin > 0
      ? totalBitcoin * normalizedCurrentPrice
      : null;
  const pnlAbsolute = currentValue === null ? null : currentValue - totalInvested;
  const pnlPercent =
    pnlAbsolute === null || totalInvested <= 0 ? null : (pnlAbsolute / totalInvested) * 100;

  return {
    averageBuyPrice,
    currentPrice: normalizedCurrentPrice,
    currentValue,
    pnlAbsolute,
    pnlPercent,
    totalBitcoin,
    totalEntries,
    totalInvested,
  };
}

export function buildDcaView(entries: DcaEntry[], currentPrice: number | null) {
  const items = buildDcaEntries(entries);

  return {
    items,
    summary: buildDcaSummary(items, currentPrice),
  };
}
