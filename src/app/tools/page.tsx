import type { Metadata } from "next";
import StructuredData from "../../components/StructuredData";
import { toolCards } from "../../data/tools";
import { createCollectionPageSchema, createPageMetadata, serializeJsonLd } from "../../lib/seo";
import ToolsPage from "../../views/ToolsPage";

const description =
  "Bitcoin-Tools fuer konkrete Entscheidungen: ein bewusst fokussierter Bereich fuer Rechner und Hilfen, aktuell mit dem DCA-Rechner als erstem vollstaendigen Werkzeug.";

export const metadata: Metadata = createPageMetadata({
  title: "Tools",
  description,
  path: "/tools",
});

export default function ToolsRoute() {
  return (
    <>
      <StructuredData
        data={serializeJsonLd(
          createCollectionPageSchema({
            name: "Bitcoin-Tools",
            description,
            path: "/tools",
            items: toolCards.map((tool) => ({
              name: tool.title,
              path: tool.href,
            })),
          })
        )}
      />
      <ToolsPage />
    </>
  );
}
