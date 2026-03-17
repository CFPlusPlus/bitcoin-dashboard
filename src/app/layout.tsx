import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteNavigation from "../components/SiteNavigation";
import StructuredData from "../components/StructuredData";
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
      <body>
        <StructuredData data={serializeJsonLd(createWebsiteSchema())} />
        <main className="page">
          <div className="container app-shell">
            <header className="site-header">
              <div>
                <p className="site-kicker">Bitcoin Dashboard</p>
                <h1 className="site-title">Dashboard und Tools in einer klaren Struktur</h1>
              </div>

              <SiteNavigation />
            </header>

            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
