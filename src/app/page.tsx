import type { Metadata } from "next";
import StructuredData from "../components/StructuredData";
import { homePageMetadata } from "../lib/public-metadata";
import { createPageMetadata } from "../lib/seo";
import { createWebPageSchema, serializeJsonLd } from "../lib/seo";
import HomePage from "../views/HomePage";

export const metadata: Metadata = createPageMetadata({
  title: homePageMetadata.title,
  description: homePageMetadata.description,
  path: homePageMetadata.path,
});

export default function HomeRoute() {
  return (
    <>
      <StructuredData
        data={serializeJsonLd(
          createWebPageSchema({
            name: homePageMetadata.schemaName,
            description: homePageMetadata.description,
            path: homePageMetadata.path,
          })
        )}
      />
      <HomePage />
    </>
  );
}
