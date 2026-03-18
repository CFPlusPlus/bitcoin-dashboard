import type { Metadata } from "next";
import "../../../../styles/dca-calculator-layout.css";
import "../../../../styles/dca-calculator-form.css";
import StructuredData from "../../../../components/StructuredData";
import { isValidLocale } from "../../../../i18n/config";
import { getDictionary } from "../../../../i18n/dictionaries";
import {
  createPageMetadata,
  createSoftwareApplicationSchema,
  serializeJsonLd,
} from "../../../../lib/seo";
import DcaCalculatorPage from "../../../../views/DcaCalculatorPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const metadata = getDictionary(locale).metadata.dca;

  return createPageMetadata({
    locale,
    title: metadata.title,
    description: metadata.description,
    path: metadata.path,
  });
}

export default async function DcaCalculatorRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return null;
  }

  const metadata = getDictionary(locale).metadata.dca;

  return (
    <>
      <StructuredData
        data={serializeJsonLd(
          createSoftwareApplicationSchema({
            locale,
            name: metadata.schemaName,
            description: metadata.description,
            path: metadata.path,
          })
        )}
      />
      <DcaCalculatorPage />
    </>
  );
}
