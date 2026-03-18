import type { Metadata } from "next";
import StructuredData from "../../../components/StructuredData";
import { isValidLocale } from "../../../i18n/config";
import { getDictionary } from "../../../i18n/dictionaries";
import { getToolCards } from "../../../data/tools";
import { createCollectionPageSchema, createPageMetadata, serializeJsonLd } from "../../../lib/seo";
import ToolsPage from "../../../views/ToolsPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const metadata = getDictionary(locale).metadata.tools;

  return createPageMetadata({
    locale,
    title: metadata.title,
    description: metadata.description,
    path: metadata.path,
  });
}

export default async function ToolsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return null;
  }

  const dictionary = getDictionary(locale);
  const metadata = dictionary.metadata.tools;
  const toolCards = getToolCards(locale);

  return (
    <>
      <StructuredData
        data={serializeJsonLd(
          createCollectionPageSchema({
            locale,
            name: metadata.schemaName,
            description: metadata.description,
            path: metadata.path,
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
