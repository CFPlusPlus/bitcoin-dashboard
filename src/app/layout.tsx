import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/newsreader";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import SiteNavigation from "../components/SiteNavigation";
import StructuredData from "../components/StructuredData";
import PageContainer from "../components/ui/layout/PageContainer";
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
        <main className="min-h-screen py-0">
          <header className="w-full border-b border-border-default/80 bg-surface">
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <p className="shrink-0 border-r border-border-subtle pr-3 font-mono text-[0.68rem] uppercase tracking-[0.26em] text-accent">
                  Bitcoin Dashboard
                </p>
                <p className="truncate font-serif text-lg tracking-[-0.03em] text-fg-secondary sm:text-xl">
                  <span className="text-accent">Bitcoin</span> in ruhigerem Fokus
                </p>
              </div>

              <SiteNavigation />
            </div>
          </header>

          <PageContainer className="flex flex-col gap-5 py-4 sm:py-5">
            {children}
          </PageContainer>
        </main>
      </body>
    </html>
  );
}
