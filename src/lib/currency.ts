import type { AppLocale } from "../i18n/config";

export type Currency = string;

const CUSTOM_CURRENCY_DISPLAY_NAMES: Record<AppLocale, Record<string, string>> = {
  de: {
    eth: "Ethereum",
    ltc: "Litecoin",
    bch: "Bitcoin Cash",
    bnb: "Binance Coin",
    eos: "EOS",
    xrp: "XRP",
    xlm: "Stellar",
    link: "Chainlink",
    dot: "Polkadot",
    yfi: "yearn.finance",
    sol: "Solana",
    bits: "Bits (μBTC)",
    sats: "Satoshis",
    xag: "Silber",
    xau: "Gold",
  },
  en: {
    eth: "Ethereum",
    ltc: "Litecoin",
    bch: "Bitcoin Cash",
    bnb: "Binance Coin",
    eos: "EOS",
    xrp: "XRP",
    xlm: "Stellar",
    link: "Chainlink",
    dot: "Polkadot",
    yfi: "yearn.finance",
    sol: "Solana",
    bits: "Bits (μBTC)",
    sats: "Satoshis",
    xag: "Silver",
    xau: "Gold",
  },
};

const COINGECKO_SUPPORTED_CURRENCIES = [
  "eth",
  "ltc",
  "bch",
  "bnb",
  "eos",
  "xrp",
  "xlm",
  "link",
  "dot",
  "yfi",
  "sol",
  "usd",
  "aed",
  "ars",
  "aud",
  "bdt",
  "bhd",
  "bmd",
  "brl",
  "cad",
  "chf",
  "clp",
  "cny",
  "czk",
  "dkk",
  "eur",
  "gbp",
  "gel",
  "hkd",
  "huf",
  "idr",
  "ils",
  "inr",
  "jpy",
  "krw",
  "kwd",
  "lkr",
  "mmk",
  "mxn",
  "myr",
  "ngn",
  "nok",
  "nzd",
  "php",
  "pkr",
  "pln",
  "rub",
  "sar",
  "sek",
  "sgd",
  "thb",
  "try",
  "twd",
  "uah",
  "vef",
  "vnd",
  "zar",
  "xag",
  "xau",
  "bits",
  "sats",
] as const;

const ISO_CURRENCY_FALLBACK = [
  "aed",
  "afn",
  "all",
  "amd",
  "ang",
  "aoa",
  "ars",
  "aud",
  "awg",
  "azn",
  "bam",
  "bbd",
  "bdt",
  "bgn",
  "bhd",
  "bif",
  "bmd",
  "bnd",
  "bob",
  "brl",
  "bsd",
  "btn",
  "bwp",
  "byn",
  "bzd",
  "cad",
  "cdf",
  "chf",
  "clp",
  "cny",
  "cop",
  "crc",
  "cuc",
  "cup",
  "cve",
  "czk",
  "djf",
  "dkk",
  "dop",
  "dzd",
  "egp",
  "ern",
  "etb",
  "eur",
  "fjd",
  "fkp",
  "gbp",
  "gel",
  "ghs",
  "gip",
  "gmd",
  "gnf",
  "gtq",
  "gyd",
  "hkd",
  "hnl",
  "hrk",
  "htg",
  "huf",
  "idr",
  "ils",
  "inr",
  "iqd",
  "irr",
  "isk",
  "jmd",
  "jod",
  "jpy",
  "kes",
  "kgs",
  "khr",
  "kmf",
  "kpw",
  "krw",
  "kwd",
  "kyd",
  "kzt",
  "lak",
  "lbp",
  "lkr",
  "lrd",
  "lsl",
  "lyd",
  "mad",
  "mdl",
  "mga",
  "mkd",
  "mmk",
  "mnt",
  "mop",
  "mru",
  "mur",
  "mvr",
  "mwk",
  "mxn",
  "myr",
  "mzn",
  "nad",
  "ngn",
  "nio",
  "nok",
  "npr",
  "nzd",
  "omr",
  "pab",
  "pen",
  "pgk",
  "php",
  "pkr",
  "pln",
  "pyg",
  "qar",
  "ron",
  "rsd",
  "rub",
  "rwf",
  "sar",
  "sbd",
  "scr",
  "sdg",
  "sek",
  "sgd",
  "shp",
  "sle",
  "sll",
  "sos",
  "srd",
  "ssp",
  "stn",
  "svc",
  "syp",
  "szl",
  "thb",
  "tjs",
  "tmt",
  "tnd",
  "top",
  "try",
  "ttd",
  "twd",
  "tzs",
  "uah",
  "ugx",
  "usd",
  "uyu",
  "uzs",
  "ves",
  "vnd",
  "vuv",
  "wst",
  "xaf",
  "xcd",
  "xcg",
  "xdr",
  "xof",
  "xpf",
  "xsu",
  "yer",
  "zar",
  "zmw",
  "zwg",
  "zwl",
] as const;

function getIsoSupportedCurrencies() {
  if (typeof Intl.supportedValuesOf !== "function") {
    return [...ISO_CURRENCY_FALLBACK];
  }

  return Intl.supportedValuesOf("currency").map((value) => value.toLowerCase());
}

const isoSupportedCurrencySet = new Set<string>(getIsoSupportedCurrencies());

export const SUPPORTED_CURRENCIES = [...COINGECKO_SUPPORTED_CURRENCIES].sort((left, right) =>
  left.localeCompare(right)
);

const supportedCurrencySet = new Set<string>(SUPPORTED_CURRENCIES);
const fiatCurrencySet = new Set<string>(
  SUPPORTED_CURRENCIES.filter((currency) => isoSupportedCurrencySet.has(currency))
);

export const DEFAULT_CURRENCY = "usd";
export const CURRENCY_STORAGE_KEY = "bitcoin-dashboard:currency";
export const RECENT_CURRENCIES_STORAGE_KEY = "bitcoin-dashboard:recent-currencies";
export const POPULAR_CURRENCIES: Currency[] = ["eur", "usd", "gbp", "jpy", "chf"].filter(
  (currency) => supportedCurrencySet.has(currency)
);
export const FIAT_CURRENCIES = SUPPORTED_CURRENCIES.filter((currency) =>
  fiatCurrencySet.has(currency)
);
export const NON_FIAT_CURRENCIES = SUPPORTED_CURRENCIES.filter(
  (currency) => !fiatCurrencySet.has(currency)
);

export function parseCurrency(value: string | null | undefined): Currency | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (!supportedCurrencySet.has(normalizedValue)) {
    return null;
  }

  return normalizedValue;
}

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && supportedCurrencySet.has(value);
}

export function isFiatCurrency(currency: Currency) {
  return fiatCurrencySet.has(currency);
}

export function normalizeCurrencyList(value: unknown, maxItems = 6): Currency[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: Currency[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const parsed = parseCurrency(entry);

    if (!parsed || seen.has(parsed)) {
      continue;
    }

    seen.add(parsed);
    normalized.push(parsed);

    if (normalized.length >= maxItems) {
      break;
    }
  }

  return normalized;
}

export function formatCurrencyLabel(currency: Currency) {
  return currency.toUpperCase();
}

export function getCurrencyDisplayName(currency: Currency, locale: AppLocale) {
  const customName = CUSTOM_CURRENCY_DISPLAY_NAMES[locale][currency];

  if (customName) {
    return customName;
  }

  if (typeof Intl.DisplayNames !== "function") {
    return formatCurrencyLabel(currency);
  }

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "currency" });
    return displayNames.of(currency.toUpperCase()) ?? formatCurrencyLabel(currency);
  } catch {
    return formatCurrencyLabel(currency);
  }
}
