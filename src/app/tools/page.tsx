import type { Metadata } from "next";
import { createPageMetadata } from "../../lib/seo";
import ToolsPage from "../../views/ToolsPage";

export const metadata: Metadata = createPageMetadata({
  title: "Tools",
  description:
    "Bitcoin-Tools mit interaktiven Rechnern und Experimenten. Aktuell inklusive DCA-Rechner fuer Durchschnittskaufpreis und Performance.",
  path: "/tools",
});

export default function ToolsRoute() {
  return <ToolsPage />;
}
