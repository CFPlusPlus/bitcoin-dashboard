import type { Metadata } from "next";
import StructuredData from "../../components/StructuredData";
import { isValidLocale } from "../../i18n/config";
import { getDictionary } from "../../i18n/dictionaries";
import { createPageMetadata, createWebPageSchema, serializeJsonLd } from "../../lib/seo";
import HomePage from "../../views/HomePage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const metadata = getDictionary(locale).metadata.home;

  return createPageMetadata({
    locale,
    title: metadata.title,
    description: metadata.description,
    path: metadata.path,
  });
}

export default async function HomeRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return null;
  }

  const metadata = getDictionary(locale).metadata.home;

  return (
    <>
      <StructuredData
        data={serializeJsonLd(
          createWebPageSchema({
            locale,
            name: metadata.schemaName,
            description: metadata.description,
            path: metadata.path,
          })
        )}
      />
      <HomePage />
    </>
  );
}
