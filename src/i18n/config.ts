export const LOCALES = ["de", "en"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "de";
export const LOCALE_COOKIE_NAME = "bitcoin-dashboard-locale";

export const localeLabels: Record<AppLocale, string> = {
  de: "Deutsch",
  en: "English",
};

export const localeMeta: Record<
  AppLocale,
  {
    bcp47: string;
    og: string;
  }
> = {
  de: {
    bcp47: "de-DE",
    og: "de_DE",
  },
  en: {
    bcp47: "en-US",
    og: "en_US",
  },
};

export function isValidLocale(value: string): value is AppLocale {
  return LOCALES.includes(value as AppLocale);
}

export function stripLocaleFromPathname(pathname: string) {
  const segments = pathname.split("/");
  const firstSegment = segments[1];

  if (!firstSegment || !isValidLocale(firstSegment)) {
    return pathname || "/";
  }

  const rest = pathname.slice(firstSegment.length + 1);
  return rest || "/";
}

export function getLocalizedPathname(locale: AppLocale, pathname = "/") {
  const normalizedPath = stripLocaleFromPathname(pathname);

  if (!normalizedPath || normalizedPath === "/") {
    return `/${locale}`;
  }

  return `/${locale}${normalizedPath}`;
}

export function hasLocalePrefix(pathname: string) {
  const firstSegment = pathname.split("/")[1];
  return Boolean(firstSegment && isValidLocale(firstSegment));
}

export function getAlternateLocalePath(pathname: string, locale: AppLocale) {
  return getLocalizedPathname(locale, pathname);
}
