import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type AppLocale,
  getLocalizedPathname,
  isValidLocale,
} from "./src/i18n/config";

function pickLocaleFromHeader(header: string | null): AppLocale {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  const accepted = header
    .split(",")
    .map((entry) => entry.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean);

  for (const value of accepted) {
    if (value === "de" || value?.startsWith("de-")) {
      return "de";
    }

    if (value === "en" || value?.startsWith("en-")) {
      return "en";
    }
  }

  return DEFAULT_LOCALE;
}

function getPreferredLocale(request: NextRequest): AppLocale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  return pickLocaleFromHeader(request.headers.get("accept-language"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const locale = getPreferredLocale(request);
  const response = NextResponse.redirect(
    new URL(getLocalizedPathname(locale, pathname), request.url)
  );

  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: ["/", "/tools", "/tools/dca-rechner"],
};
