import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/newsreader";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { metadataBase } from "../lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body className="min-h-screen bg-app text-fg antialiased">{children}</body>
    </html>
  );
}
