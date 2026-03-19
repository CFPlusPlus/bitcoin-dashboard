import type { Metadata } from "next";
import StructuredData from "../../../components/StructuredData";
import { isValidLocale } from "../../../i18n/config";
import { getDictionary } from "../../../i18n/dictionaries";
import { createPageMetadata, createWebPageSchema, serializeJsonLd } from "../../../lib/seo";
import LegalPlaceholderPage from "../../../views/LegalPlaceholderPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const metadata = getDictionary(locale).metadata.privacy;

  return createPageMetadata({
    locale,
    title: metadata.title,
    description: metadata.description,
    path: metadata.path,
  });
}

export default async function PrivacyRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return null;
  }

  const dictionary = getDictionary(locale);
  const metadata = dictionary.metadata.privacy;
  const copy = dictionary.legal.privacy;

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
      <LegalPlaceholderPage
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        bodyTitle={copy.bodyTitle}
        body={copy.body}
      />
    </>
  );
}
