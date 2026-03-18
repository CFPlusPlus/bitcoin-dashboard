import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/newsreader";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isValidLocale, localeMeta } from "../i18n/config";
import { metadataBase } from "../lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={localeMeta[locale].bcp47}>
      <body className="min-h-screen bg-app text-fg antialiased">{children}</body>
    </html>
  );
}
