import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteNavigation from "../components/SiteNavigation";
import { DEFAULT_DESCRIPTION, SITE_NAME, metadataBase } from "../lib/seo";
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
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
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
