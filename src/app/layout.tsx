import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteNavigation from "../components/SiteNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bitcoin Dashboard",
    template: "%s | Bitcoin Dashboard",
  },
  description:
    "Bitcoin dashboard with market overview, network data, sentiment and Bitcoin tools.",
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
