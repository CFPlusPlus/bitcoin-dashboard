import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/newsreader";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { SITE_NAME, metadataBase } from "../lib/seo";
import { DEFAULT_LOCALE, localeMeta } from "../i18n/config";
import { getThemeInitScript } from "../lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: ["/favicon.svg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={localeMeta[DEFAULT_LOCALE].bcp47} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
        <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
      </head>
      <body className="min-h-screen bg-app text-fg antialiased">{children}</body>
    </html>
  );
}
