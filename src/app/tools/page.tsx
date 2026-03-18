import type { Metadata } from "next";
import StructuredData from "../../components/StructuredData";
import { toolCards } from "../../data/tools";
import { toolsPageMetadata } from "../../lib/public-metadata";
import { createCollectionPageSchema, createPageMetadata, serializeJsonLd } from "../../lib/seo";
import ToolsPage from "../../views/ToolsPage";

export const metadata: Metadata = createPageMetadata({
  title: toolsPageMetadata.title,
  description: toolsPageMetadata.description,
  path: toolsPageMetadata.path,
});

export default function ToolsRoute() {
  return (
    <>
      <StructuredData
        data={serializeJsonLd(
          createCollectionPageSchema({
            name: toolsPageMetadata.schemaName,
            description: toolsPageMetadata.description,
            path: toolsPageMetadata.path,
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
