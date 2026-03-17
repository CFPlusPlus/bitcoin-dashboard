import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteNavigation from "../components/SiteNavigation";
import StructuredData from "../components/StructuredData";
import Surface from "../components/ui/Surface";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE_PATH,
  SITE_NAME,
  createWebsiteSchema,
  getAbsoluteUrl,
  metadataBase,
  serializeJsonLd,
} from "../lib/seo";
import "./globals.css";
import "../styles/legacy.css";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: getAbsoluteUrl(DEFAULT_SOCIAL_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [getAbsoluteUrl(DEFAULT_SOCIAL_IMAGE_PATH)],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-app text-fg antialiased">
        <StructuredData data={serializeJsonLd(createWebsiteSchema())} />
        <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto flex w-full max-w-[var(--container-max-width)] flex-col gap-6">
            <Surface
              as="header"
              tone="elevated"
              className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"
            >
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Bitcoin Dashboard
                </p>
                <p className="mt-3 max-w-2xl font-serif text-2xl leading-tight text-fg sm:text-4xl">
                  Dashboard und Tools in einer klaren Struktur
                </p>
              </div>

              <SiteNavigation />
            </Surface>

            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
