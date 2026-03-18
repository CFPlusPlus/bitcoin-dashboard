import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALES,
  type AppLocale,
  getLocalizedPathname,
  hasLocalePrefix,
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

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (hasLocalePrefix(pathname)) {
    const locale = pathname.split("/")[1];

    if (!isValidLocale(locale)) {
      return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, request.url));
    }

    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
